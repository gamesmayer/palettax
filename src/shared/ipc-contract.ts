import { PaletteFormat } from "./types";

export const IPC_CHANNELS = {
	IMPORT_PALETTE: "palette:import",
	EXPORT_PALETTE: "palette:export",
	IMPORT_ENVIRONMENT_IMAGE: "environment:import-image",
	UPDATE_AVAILABLE: "update:available",
	OPEN_EXTERNAL_URL: "update:open-external-url",
	GET_SETTINGS: "settings:get",
	SET_LANGUAGE: "settings:set-language",
} as const;

export interface ImportedFile {
	filePath: string;
	content: string;
}

export interface ImportPaletteResult {
	canceled: boolean;
	files: ImportedFile[];
}

export interface ImportEnvironmentImageResult {
	canceled: boolean;
	file?: { filePath: string; bytes: Uint8Array };
}

export interface ExportPaletteRequest {
	suggestedFileName: string;
	format: PaletteFormat;
	content: string;
	defaultDirectory?: string;
}

export interface ExportPaletteResult {
	canceled: boolean;
	filePath?: string;
}

export interface UpdateInfo {
	version: string;
	tagName: string;
	releaseUrl: string;
	releaseNotes?: string;
	publishedAt?: string;
}

export interface AppSettings {
	language: string;
}
