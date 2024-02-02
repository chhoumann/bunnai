#!/usr/bin/env bun
import { cli, command } from "cleye";
import { version } from "../package.json";
import { setConfigs, showConfigUI } from "./config";
import { run } from "./run";

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
				await setConfigs(
					keyValues.map((kv: string) => kv.split("=") as [string, string]),
				);

				return;
			}

			throw new Error(`Invalid mode: ${mode}`);
		})();
	},
);

export const CLI = cli(
	{
		name: "bunnai",
		version,
		commands: [config],
	},
	() => {
		(async () => {
			run();
		})();
	},
);
