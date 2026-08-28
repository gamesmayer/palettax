import { dialog, ipcMain } from "electron";
import { readFile } from "node:fs/promises";
import {
	IPC_CHANNELS,
	ImportEnvironmentImageResult,
} from "../../shared/ipc-contract";

export function registerEnvironmentImageHandlers(): void {
	ipcMain.handle(
		IPC_CHANNELS.IMPORT_ENVIRONMENT_IMAGE,
		async (): Promise<ImportEnvironmentImageResult> => {
			const result = await dialog.showOpenDialog({
				properties: ["openFile"],
				filters: [{ name: "PNG Image", extensions: ["png"] }],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { canceled: true };
			}

			const filePath = result.filePaths[0];
			const bytes = await readFile(filePath);
			return {
				canceled: false,
				file: { filePath, bytes: new Uint8Array(bytes) },
			};
		}
	);
}
