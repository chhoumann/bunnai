import path from "path";
import os from "os";
import { template as defaultTemplate } from "./template";

const configPath = path.join(os.homedir(), ".bunnai");

export interface Config {
    OPENAI_API_KEY?: string;
    model?: string;
    promptTemplate?: string;
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
    const config = Object.keys(DEFAULT_CONFIG);

    for (const key of keys) {
        if (!config.includes(key)) {
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
