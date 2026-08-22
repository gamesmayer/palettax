import { contextBridge, IpcRendererEvent, ipcRenderer } from 'electron';
import {
  ExportPaletteRequest,
  ExportPaletteResult,
  IPC_CHANNELS,
  ImportPaletteResult
} from '../shared/ipc-contract';
import { PaletteFormat } from '../shared/palette-formats/types';

const paletteApi = {
  importPalette: (): Promise<ImportPaletteResult> => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PALETTE),
  exportPalette: (req: ExportPaletteRequest): Promise<ExportPaletteResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PALETTE, req),
  onTriggerImport: (callback: () => void): (() => void) => {
    const listener = (): void => callback();
    ipcRenderer.on('menu:trigger-import', listener);
    return () => ipcRenderer.removeListener('menu:trigger-import', listener);
  },
  onTriggerExport: (callback: (format: PaletteFormat) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, format: PaletteFormat): void => callback(format);
    ipcRenderer.on('menu:trigger-export', listener);
    return () => ipcRenderer.removeListener('menu:trigger-export', listener);
  },
  onTriggerNewPalette: (callback: () => void): (() => void) => {
    const listener = (): void => callback();
    ipcRenderer.on('menu:trigger-new-palette', listener);
    return () => ipcRenderer.removeListener('menu:trigger-new-palette', listener);
  },
  onRequestClose: (callback: () => void): (() => void) => {
    const listener = (): void => callback();
    ipcRenderer.on('app:request-close', listener);
    return () => ipcRenderer.removeListener('app:request-close', listener);
  },
  confirmClose: (): void => {
    ipcRenderer.send('app:confirm-close');
  }
};

export type PaletteApi = typeof paletteApi;

contextBridge.exposeInMainWorld('paletteApi', paletteApi);
