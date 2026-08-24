import { app, dialog, ipcMain } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { detectFormatByExtension } from "../../shared/palette-formats/detectFormat";
import {
	ExportPaletteRequest,
	ExportPaletteResult,
	IPC_CHANNELS,
	ImportPaletteResult,
} from "../../shared/ipc-contract";

const EXPORT_FILTER_NAMES: Record<ExportPaletteRequest["format"], string> = {
	pal: "JASC Palette",
	gpl: "GIMP Palette",
	txt: "Hex List",
	css: "CSS Stylesheet",
	ase: "Adobe Swatch Exchange",
	aco: "Adobe Color Swatch",
	png: "PNG Image",
};

function encodingFor(format: string | null): BufferEncoding {
	return format === "ase" || format === "aco" || format === "png"
		? "latin1"
		: "utf-8";
}

export function registerPaletteFileHandlers(): void {
	ipcMain.handle(
		IPC_CHANNELS.IMPORT_PALETTE,
		async (): Promise<ImportPaletteResult> => {
			const result = await dialog.showOpenDialog({
				properties: ["openFile", "multiSelections"],
				filters: [
					{
						name: "Palette Files",
						extensions: ["pal", "gpl", "txt", "css", "ase", "aco", "png"],
					},
				],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { canceled: true, files: [] };
			}

			const files = await Promise.all(
				result.filePaths.map(async (filePath) => ({
					filePath,
					content: await readFile(
						filePath,
						encodingFor(detectFormatByExtension(filePath))
					),
				}))
			);

			return { canceled: false, files };
		}
	);

	ipcMain.handle(
		IPC_CHANNELS.EXPORT_PALETTE,
		async (_event, req: ExportPaletteRequest): Promise<ExportPaletteResult> => {
			const result = await dialog.showSaveDialog({
				defaultPath: join(
					req.defaultDirectory ?? app.getPath("documents"),
					req.suggestedFileName
				),
				filters: [
					{
						name: EXPORT_FILTER_NAMES[req.format],
						extensions: [req.format],
					},
				],
			});

			if (result.canceled || !result.filePath) {
				return { canceled: true };
			}

			await writeFile(result.filePath, req.content, encodingFor(req.format));
			return { canceled: false, filePath: result.filePath };
		}
	);
}
