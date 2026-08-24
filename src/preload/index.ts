import { contextBridge, IpcRendererEvent, ipcRenderer } from "electron";
import {
	ExportPaletteRequest,
	ExportPaletteResult,
	IPC_CHANNELS,
	ImportPaletteResult,
	UpdateInfo,
} from "../shared/ipc-contract";
import { PaletteFormat } from "../shared/types";

const paletteApi = {
	importPalette: (): Promise<ImportPaletteResult> =>
		ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PALETTE),
	exportPalette: (req: ExportPaletteRequest): Promise<ExportPaletteResult> =>
		ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PALETTE, req),
	onTriggerImport: (callback: () => void): (() => void) => {
		const listener = (): void => callback();
		ipcRenderer.on("menu:trigger-import", listener);
		return () => ipcRenderer.removeListener("menu:trigger-import", listener);
	},
	onTriggerExport: (
		callback: (format: PaletteFormat) => void
	): (() => void) => {
		const listener = (_event: IpcRendererEvent, format: PaletteFormat): void =>
			callback(format);
		ipcRenderer.on("menu:trigger-export", listener);
		return () => ipcRenderer.removeListener("menu:trigger-export", listener);
	},
	onTriggerNewPalette: (callback: () => void): (() => void) => {
		const listener = (): void => callback();
		ipcRenderer.on("menu:trigger-new-palette", listener);
		return () =>
			ipcRenderer.removeListener("menu:trigger-new-palette", listener);
	},
	onTriggerHelp: (callback: () => void): (() => void) => {
		const listener = (): void => callback();
		ipcRenderer.on("menu:trigger-help", listener);
		return () => ipcRenderer.removeListener("menu:trigger-help", listener);
	},
	onRequestClose: (callback: () => void): (() => void) => {
		const listener = (): void => callback();
		ipcRenderer.on("app:request-close", listener);
		return () => ipcRenderer.removeListener("app:request-close", listener);
	},
	confirmClose: (): void => {
		ipcRenderer.send("app:confirm-close");
	},
	onUpdateAvailable: (callback: (info: UpdateInfo) => void): (() => void) => {
		const listener = (_event: IpcRendererEvent, info: UpdateInfo): void =>
			callback(info);
		ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, listener);
		return () =>
			ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_AVAILABLE, listener);
	},
	openExternalUrl: (url: string): void => {
		ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL_URL, url);
	},
};

export type PaletteApi = typeof paletteApi;

contextBridge.exposeInMainWorld("paletteApi", paletteApi);
