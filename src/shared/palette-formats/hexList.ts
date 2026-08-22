import { generateId, hexToRgb, rgbToHex } from '../color';
import { Palette, PaletteColor, PaletteParseError } from './types';

function baseNameFromPath(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  return fileName.replace(/\.[^.]+$/, '');
}

const HEX_LINE = /^#?[0-9a-fA-F]{6}$/;

export function parseHexTxt(content: string, filePath: string): Palette {
  const lines = content.split(/\r?\n/);
  const colors: PaletteColor[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '' || !HEX_LINE.test(line)) {
      continue;
    }

    const { r, g, b } = hexToRgb(line);
    colors.push({
      id: generateId(),
      r,
      g,
      b,
      hex: rgbToHex(r, g, b)
    });
  }

  if (colors.length === 0) {
    throw new PaletteParseError('El archivo no contiene ningún color hexadecimal válido.');
  }

  return {
    id: generateId(),
    name: baseNameFromPath(filePath),
    colors,
    sourceFormat: 'txt',
    filePath
  };
}

export function serializeHexTxt(palette: Palette): string {
  const lines = palette.colors.map((color) => rgbToHex(color.r, color.g, color.b));
  return `${lines.join('\n')}\n`;
}
