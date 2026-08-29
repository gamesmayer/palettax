import { useCallback } from "react";
import {
	PaletteFormat,
	parsePaletteFile,
	PngExportOptions,
	serializePaletteFile,
} from "../../../shared/palette-formats";
import i18n from "../i18n/i18n";
import { usePaletteStore } from "../store/paletteStore";

export function usePaletteActions(): {
	importPalettes: () => Promise<void>;
	exportActivePalette: (
		format: PaletteFormat,
		pngOptions?: PngExportOptions
	) => Promise<void>;
} {
	const addPalette = usePaletteStore((state) => state.addPalette);

	const importPalettes = useCallback(async (): Promise<void> => {
		const result = await window.paletteApi.importPalette();
		if (result.canceled) return;

		for (const file of result.files) {
			try {
				const palette = parsePaletteFile(file.filePath, file.content);
				addPalette(palette);
			} catch (error) {
				window.alert(
					i18n.t("app:alerts.importFailed", {
						filePath: file.filePath,
						message: (error as Error).message,
					})
				);
			}
		}
	}, [addPalette]);

	const exportActivePalette = useCallback(
		async (
			format: PaletteFormat,
			pngOptions?: PngExportOptions
		): Promise<void> => {
			const palette = usePaletteStore.getState().getActivePalette();
			if (!palette) return;

			let content: string;
			try {
				content = serializePaletteFile(palette, format, pngOptions);
			} catch (error) {
				window.alert(
					i18n.t("app:alerts.exportFailed", {
						message: (error as Error).message,
					})
				);
				return;
			}
			const suggestedFileName = `${palette.name}.${format}`;
			const defaultDirectory = palette.filePath?.replace(/[\\/][^\\/]*$/, "");

			const result = await window.paletteApi.exportPalette({
				suggestedFileName,
				format,
				content,
				defaultDirectory,
			});

			if (!result.canceled) {
				window.alert(
					i18n.t("app:alerts.exportSucceeded", { filePath: result.filePath })
				);
			}
		},
		[]
	);

	return { importPalettes, exportActivePalette };
}
