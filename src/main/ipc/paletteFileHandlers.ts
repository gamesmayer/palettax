import { app, dialog, ipcMain } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ExportPaletteRequest,
  ExportPaletteResult,
  IPC_CHANNELS,
  ImportPaletteResult
} from '../../shared/ipc-contract';

export function registerPaletteFileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.IMPORT_PALETTE, async (): Promise<ImportPaletteResult> => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Palette Files', extensions: ['pal', 'gpl'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, files: [] };
    }

    const files = await Promise.all(
      result.filePaths.map(async (filePath) => ({
        filePath,
        content: await readFile(filePath, 'utf-8')
      }))
    );

    return { canceled: false, files };
  });

  ipcMain.handle(
    IPC_CHANNELS.EXPORT_PALETTE,
    async (_event, req: ExportPaletteRequest): Promise<ExportPaletteResult> => {
      const result = await dialog.showSaveDialog({
        defaultPath: join(req.defaultDirectory ?? app.getPath('documents'), req.suggestedFileName),
        filters: [
          {
            name: req.format === 'pal' ? 'JASC Palette' : 'GIMP Palette',
            extensions: [req.format]
          }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { canceled: true };
      }

      await writeFile(result.filePath, req.content, 'utf-8');
      return { canceled: false, filePath: result.filePath };
    }
  );
}
