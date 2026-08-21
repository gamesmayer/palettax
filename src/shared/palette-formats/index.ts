export * from './types';
export * from './jascPal';
export * from './gimpGpl';
export * from './detectFormat';

import { Palette, PaletteFormat, PaletteParseError } from './types';
import { parsePal, serializePal } from './jascPal';
import { parseGpl, serializeGpl } from './gimpGpl';
import { detectFormatByExtension } from './detectFormat';

export function parsePaletteFile(filePath: string, content: string): Palette {
  const format = detectFormatByExtension(filePath);
  if (format === 'pal') return parsePal(content, filePath);
  if (format === 'gpl') return parseGpl(content, filePath);
  throw new PaletteParseError(`Extensión no soportada: ${filePath}`);
}

export function serializePaletteFile(palette: Palette, format: PaletteFormat): string {
  return format === 'pal' ? serializePal(palette) : serializeGpl(palette);
}
