import { useCallback } from 'react';
import { PaletteFormat, parsePaletteFile, serializePaletteFile } from '../../../shared/palette-formats';
import { usePaletteStore } from '../store/paletteStore';

export function usePaletteActions(): {
  importPalettes: () => Promise<void>;
  exportActivePalette: (format: PaletteFormat) => Promise<void>;
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
        window.alert(`No se pudo importar ${file.filePath}: ${(error as Error).message}`);
      }
    }
  }, [addPalette]);

  const exportActivePalette = useCallback(async (format: PaletteFormat): Promise<void> => {
    const palette = usePaletteStore.getState().getActivePalette();
    if (!palette) return;

    const content = serializePaletteFile(palette, format);
    const suggestedFileName = `${palette.name}.${format}`;
    const defaultDirectory = palette.filePath?.replace(/[\\/][^\\/]*$/, '');

    const result = await window.paletteApi.exportPalette({
      suggestedFileName,
      format,
      content,
      defaultDirectory
    });

    if (!result.canceled) {
      window.alert(`Paleta exportada a ${result.filePath}`);
    }
  }, []);

  return { importPalettes, exportActivePalette };
}
