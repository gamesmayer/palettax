import { app } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppSettings } from "../shared/ipc-contract";
import { DEFAULT_LANGUAGE } from "../shared/i18n";

const DEFAULT_SETTINGS: AppSettings = { language: DEFAULT_LANGUAGE };

function getSettingsPath(): string {
	return join(app.getPath("userData"), "settings.json");
}

export async function readSettings(): Promise<AppSettings> {
	try {
		const content = await readFile(getSettingsPath(), "utf-8");
		return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export async function writeSettings(settings: AppSettings): Promise<void> {
	await writeFile(getSettingsPath(), JSON.stringify(settings), "utf-8");
}
