import { readConfigFile } from "./config";
import { template } from "./template";

export async function initialize() {
	const config = await readConfigFile();
	const defaultTemplatePath = config.templates.default;

	if (!(await Bun.file(defaultTemplatePath).exists())) {
		await Bun.write(defaultTemplatePath, template);
	}
}
