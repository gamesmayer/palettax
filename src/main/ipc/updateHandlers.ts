import { ipcMain, shell } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc-contract";

export function registerUpdateHandlers(): void {
	ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL_URL, (_event, url: unknown) => {
		if (typeof url === "string" && /^https:\/\/github\.com\//.test(url)) {
			void shell.openExternal(url);
		}
	});
}
