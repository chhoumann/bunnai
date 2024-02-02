import { $ } from "bun";
import { template } from "./template";
import OpenAI from "openai";
import { readConfigFile } from "./config";

export async function run() {
    const config = await readConfigFile();
    const target_dir = (await $`pwd`.text()).trim();

    if (!config.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is not set");
        process.exit(1);
    }

    if (!config.model) {
        console.error("Model is not set");
        process.exit(1);
    }

    if (!config.promptTemplate) {
        console.error("Prompt template is not set");
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
