import OpenAI from "openai";
import { $, env, file, argv } from "bun";
import dotenv from "dotenv";

const [_, self, target_dir] = argv;

const this_dir = self.replace("/index.ts", "");
$.cwd(this_dir);
dotenv.config();

const openai_api_key = process.env.OPENAI_API_KEY;

if (!openai_api_key) {
    console.error("OPENAI_API_KEY is not set");
    process.exit(1);
}

const template = await file(`${this_dir}/template.md`).text();

const oai = new OpenAI({ apiKey: openai_api_key });

const diff = await $`git diff --cached ${target_dir}`.quiet().text();

if (diff.trim().length === 0) {
    process.exit(1)
}

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

console.log(description.choices[0].message.content?.trim());
