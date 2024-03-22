import { $ } from "bun";
import OpenAI from "openai";
import { readConfigFile } from "./config";

export async function run(templateName?: string) {
	const config = await readConfigFile();

	let templateFilePath: string;
	if (templateName) {
		if (!Object.prototype.hasOwnProperty.call(config.templates, templateName)) {
			console.error(
				`Error: Template '${templateName}' does not exist in the configuration.`,
			);
			process.exit(1);
		}
		templateFilePath = config.templates[templateName];
	} else {
		templateFilePath = config.templates.default;
	}

	const templateFile = Bun.file(templateFilePath);
	if (!(await templateFile.exists())) {
		console.error(
			`Error: The template file '${templateFilePath}' does not exist.`,
		);
		process.exit(1);
	}
	const template = await templateFile.text();
	const target_dir = (await $`pwd`.text()).trim();

	if (!config.OPENAI_API_KEY) {
		console.error("OPENAI_API_KEY is not set");
		process.exit(1);
	}

	if (!config.model) {
		console.error("Model is not set");
		process.exit(1);
	}

	const diff = await $`git diff --cached ${target_dir}`.quiet().text();

	if (diff.trim().length === 0) {
		console.error(`No changes to commit in ${target_dir}`);
		process.exit(1);
	}

	const rendered_template = template.replace("{{diff}}", diff);

	const oai = new OpenAI({
		apiKey: config.OPENAI_API_KEY,
	});

	try {
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

		const content = response.choices[0].message.content;
		if (!content) {
			console.error("Failed to generate commit message");
			process.exit(1);
		}

		console.log(content.trim());
	} catch (error) {
		console.error(`Failed to fetch from openai: ${error}`);
		process.exit(1);
	}
}
