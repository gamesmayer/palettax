import { PaletteFormat } from './types';

export const IPC_CHANNELS = {
  IMPORT_PALETTE: 'palette:import',
  EXPORT_PALETTE: 'palette:export',
  UPDATE_AVAILABLE: 'update:available',
  OPEN_EXTERNAL_URL: 'update:open-external-url'
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

export interface UpdateInfo {
  version: string;
  tagName: string;
  releaseUrl: string;
  releaseNotes?: string;
  publishedAt?: string;
}
