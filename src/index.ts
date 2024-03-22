#!/usr/bin/env bun
import { cli, command } from "cleye";
import { version } from "../package.json";
import { setConfigs, showConfigUI, type Config } from "./config";
import { run } from "./run";
import { initialize } from "./utils";

const config = command(
	{
		name: "config",
		help: {
			description: "Configure bunnai",
		},
	},
	(argv) => {
		(async () => {
			const [mode, ...keyValues] = argv._;
			await initialize();

			if (!mode) {
				await showConfigUI();
				return;
			}

			if (!keyValues.length) {
				console.error(`Error: Missing required parameter "key=value"\n`);
				argv.showHelp();
				return process.exit(1);
			}

			if (mode === "set") {
				if (keyValues.includes("templates")) {
					console.error("Error: Templates not settable");
					return process.exit(1);
				}

				await setConfigs(
					keyValues.map((kv: string) => {
						const [key, value] = kv.split("=");
						return [key, value] as [keyof Config, string];
					}),
				);

				return;
			}

			console.error(`Error: Invalid mode: ${mode}`);
			process.exit(1);
		})();
	},
);

export const CLI = cli(
	{
		name: "bunnai",
		version,
		commands: [config],
		flags: {
			template: String,
		},
	},
	(argv) => {
		(async () => {
			const { template } = argv.flags;
			await initialize();

			run(template);
		})();
	},
);
