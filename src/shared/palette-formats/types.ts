export type PaletteFormat = 'pal' | 'gpl';

export interface PaletteColor {
  id: string;
  r: number;
  g: number;
  b: number;
  hex: string;
  name?: string;
}

export interface Palette {
  id: string;
  name: string;
  colors: PaletteColor[];
  sourceFormat: PaletteFormat;
  filePath?: string;
  columns?: number;
}

export class PaletteParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaletteParseError';
  }
}
