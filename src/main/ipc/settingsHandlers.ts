import { BrowserWindow, ipcMain, Menu } from "electron";
import { AppSettings, IPC_CHANNELS } from "../../shared/ipc-contract";
import { changeMainLanguage } from "../i18n";
import { buildMenu } from "../menu";
import { readSettings, writeSettings } from "../settingsStore";

export function registerSettingsHandlers(mainWindow: BrowserWindow): void {
	ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async (): Promise<AppSettings> =>
		readSettings()
	);

	ipcMain.handle(
		IPC_CHANNELS.SET_LANGUAGE,
		async (_event, language: string): Promise<AppSettings> => {
			const settings: AppSettings = { language };
			await writeSettings(settings);
			await changeMainLanguage(language);
			Menu.setApplicationMenu(buildMenu(mainWindow));
			return settings;
		}
	);
}
