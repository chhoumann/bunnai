#!/usr/bin/env bun
import { $, env } from "bun";
import { template } from "./template";

const target_dir = (await $`pwd`.text()).trim();

const openai_api_key = () => env.OPENAI_API_KEY;

if (!openai_api_key()) {
    console.error("OPENAI_API_KEY is not set");
    process.exit(1);
}

const diff = await $`git diff --cached ${target_dir}`.quiet().text();

if (diff.trim().length === 0) {
    console.error(`No changes to commit in ${target_dir}`);
    process.exit(1);
}

const rendered_template = template.replace("{{diff}}", diff);

// fetch from openai
const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
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
        model: "gpt-4-0125-preview",
        response_format: { type: "text" },
    }),
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openai_api_key()}`,
    },
});

if (!response.ok) {
    console.error(`Failed to fetch from openai: ${response.statusText}`);
    process.exit(1);
}

const data = await response.json();

if (!data.choices[0].message.content) {
    console.error("Failed to generate commit message");
    process.exit(1);
}

console.log(data.choices[0].message.content?.trim());
