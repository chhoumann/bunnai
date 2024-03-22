import { $ } from "bun";
import OpenAI from "openai";
import { readConfigFile } from "./config";

interface RunOptions {
	verbose?: boolean;
}

export async function run(options: RunOptions, templateName?: string) {
	const config = await readConfigFile();
	if (options.verbose) {
		console.debug("Configuration loaded successfully.");
	}

	let templateFilePath: string;
	if (templateName) {
		if (!Object.prototype.hasOwnProperty.call(config.templates, templateName)) {
			console.error(
				`Error: Template '${templateName}' does not exist in the configuration.`,
			);
			process.exit(1);
		}
		templateFilePath = config.templates[templateName];
		if (options.verbose) {
			console.debug(`Using template: ${templateName}`);
		}
	} else {
		templateFilePath = config.templates.default;
		if (options.verbose) {
			console.debug("Using default template.");
		}
	}

	const templateFile = Bun.file(templateFilePath);
	if (!(await templateFile.exists())) {
		console.error(
			`Error: The template file '${templateFilePath}' does not exist.`,
		);
		process.exit(1);
	}
	if (options.verbose) {
		console.debug(`Template file found: ${templateFilePath}`);
	}

	const template = await templateFile.text();
	if (options.verbose) {
		console.debug("Template file read successfully.");
	}

	const target_dir = (await $`pwd`.text()).trim();
	if (options.verbose) {
		console.debug(`Target directory: ${target_dir}`);
	}

	if (!config.OPENAI_API_KEY) {
		console.error("OPENAI_API_KEY is not set");
		process.exit(1);
	}

	if (!config.model) {
		console.error("Model is not set");
		process.exit(1);
	}

	const diffCommand = await $`git diff --cached "${target_dir}"`.quiet();
	if (options.verbose) {
		console.debug("Git diff stderr:\n", diffCommand.stderr.toString());
	}

	const diff = diffCommand.stdout.toString();
	if (options.verbose) {
		console.debug("Git diff retrieved.");
	}

	if (diff.trim().length === 0) {
		console.error(`No changes to commit in ${target_dir}`);
		process.exit(1);
	}

	const rendered_template = template.replace("{{diff}}", diff);
	if (options.verbose) {
		console.debug("Template rendered with git diff.");
	}

	const oai = new OpenAI({
		apiKey: config.OPENAI_API_KEY,
	});

	try {
		if (options.verbose) {
			console.debug("Sending request to OpenAI...");
		}
		const response = await oai.chat.completions.create({
			messages: [
				{
					role: "system",
					content:
						"You are a commit message generator. I will provide you with a git diff, and I would like you to generate an appropriate commit message using the conventional commit format. Do not write any explanations or other words, just reply with the commit message.",
				},
				{
					role: "user",
					content: rendered_template,
				},
			],
			model: config.model,
		});

		if (options.verbose) {
			console.debug("Response received from OpenAI.");
			console.debug(JSON.stringify(response, null, 2));
		}

		const content = response.choices[0].message.content;
		if (!content) {
			console.error("Failed to generate commit message");
			process.exit(1);
		}

		console.log(content.trim());
		if (options.verbose) {
			console.debug("Commit message generated and outputted.");
		}
	} catch (error) {
		console.error(`Failed to fetch from openai: ${error}`);
		process.exit(1);
	}
}
