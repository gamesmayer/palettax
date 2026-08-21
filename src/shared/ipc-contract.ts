import { PaletteFormat } from './palette-formats/types';

export const IPC_CHANNELS = {
  IMPORT_PALETTE: 'palette:import',
  EXPORT_PALETTE: 'palette:export'
} as const;

export interface ImportedFile {
  filePath: string;
  content: string;
}

export interface ImportPaletteResult {
  canceled: boolean;
  files: ImportedFile[];
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
