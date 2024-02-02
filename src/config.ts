import path from "path";
import os from "os";
import { template as defaultTemplate } from "./template";
import * as p from "@clack/prompts";
import OpenAI from "openai";

function hasOwn<T extends object, K extends PropertyKey>(
    obj: T,
    key: K
): obj is T & Record<K, unknown> {
    return key in obj && Object.prototype.hasOwnProperty.call(obj, key);
}

const configPath = path.join(os.homedir(), ".bunnai");

export interface Config {
    OPENAI_API_KEY: string;
    model: string;
    promptTemplate: string;
}

const DEFAULT_CONFIG: Config = {
    OPENAI_API_KEY: "",
    model: "gpt-4-0125-preview",
    promptTemplate: defaultTemplate,
};

export async function readConfigFile(): Promise<Config> {
    const fileExists = await Bun.file(configPath).exists();
    if (!fileExists) {
        return DEFAULT_CONFIG;
    }

    const configString = await Bun.file(configPath).text();
    const config = JSON.parse(configString);

    return {
        ...DEFAULT_CONFIG,
        ...config,
    };
}

function validateKeys(keys: string[]): asserts keys is (keyof Config)[] {
    const configKeys = Object.keys(DEFAULT_CONFIG);

    for (const key of keys) {
        if (!configKeys.includes(key)) {
            throw new Error(`Invalid config property: ${key}`);
        }
    }
}

export async function setConfigs(keyValues: [key: string, value: string][]) {
    const config = await readConfigFile();

    validateKeys(keyValues.map(([key]) => key));

    for (const [key, value] of keyValues) {
        config[key as keyof Config] = value;
    }

    await Bun.write(configPath, JSON.stringify(config));
}

export async function showConfigUI() {
    try {
        const config = await readConfigFile();

        const choice = (await p.select({
            message: "set config",
            options: [
                {
                    label: "OpenAI API Key",
                    value: "OPENAI_API_KEY",
                    hint: hasOwn<Config, keyof Config>(config, "OPENAI_API_KEY")
                        ? `sk-...${config.OPENAI_API_KEY.slice(-3)}`
                        : "not set",
                },
                {
                    label: "Model",
                    value: "model",
                    hint: config.model,
                },
                {
                    label: "Cancel",
                    value: "cancel",
                },
            ],
        })) as keyof Config | "cancel" | symbol;

        if (p.isCancel(choice)) {
            return;
        }

        if (choice === "OPENAI_API_KEY") {
            const apiKey = await p.text({
                message: "OpenAI API Key",
                initialValue: config.OPENAI_API_KEY,
            });

            await setConfigs([["OPENAI_API_KEY", apiKey as string]]);
        } else if (choice === "model") {
            const model = await p.select({
                message: "Model",
                options: (
                    await getModels()
                ).map((model) => ({
                    label: model,
                    value: model,
                })),
                initialValue: config.model,
            });

            await setConfigs([["model", model as string]]);
        }

        if (choice === "cancel") {
            return;
        }

        showConfigUI();
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
}  catch (error: any) {
        console.error(`\n${error.message}\n`);
    }
}

async function getModels() {
    const apiKey = (await readConfigFile()).OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const oai = new OpenAI({
        apiKey,
    });

    const models = await oai.models.list();
    return models.data.map((model) => model.id);
}
