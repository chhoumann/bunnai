import OpenAI from "openai";
import { $, env, file } from "bun";

const openai_api_key = env.OPENAI_API_KEY;

if (!openai_api_key) {
    console.error("OPENAI_API_KEY is not set");
    process.exit(1);
}

const oai = new OpenAI({ apiKey: openai_api_key });

const working_dir = await $`pwd`.text();

const diff = await $`git diff --cached`.quiet().text();

const template = await file(`./template.md`).text();

const rendered_template = template.replace("{{diff}}", diff);

const description = await oai.chat.completions.create({
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
    model: "gpt-4-1106-preview",
    response_format: { type: "text" },
});

console.log(description.choices[0].message.content);
