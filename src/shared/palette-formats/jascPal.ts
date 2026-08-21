import { clampByte, generateId, rgbToHex } from '../color';
import { Palette, PaletteColor, PaletteParseError } from './types';

function baseNameFromPath(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  return fileName.replace(/\.[^.]+$/, '');
}

export function parsePal(content: string, filePath: string): Palette {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  if (lines[0] !== 'JASC-PAL') {
    throw new PaletteParseError('El archivo no tiene una cabecera JASC-PAL válida.');
  }

  const colorLines = lines.slice(3).filter((line) => line.length > 0);
  const colors: PaletteColor[] = colorLines.map((line) => {
    const [rawR, rawG, rawB] = line.split(/\s+/).map(Number);
    const r = clampByte(rawR ?? 0);
    const g = clampByte(rawG ?? 0);
    const b = clampByte(rawB ?? 0);
    return { id: generateId(), r, g, b, hex: rgbToHex(r, g, b) };
  });

  return {
    id: generateId(),
    name: baseNameFromPath(filePath),
    colors,
    sourceFormat: 'pal',
    filePath
  };
}

export function serializePal(palette: Palette): string {
  const lines = ['JASC-PAL', '0100', String(palette.colors.length)];
  for (const color of palette.colors) {
    lines.push(`${clampByte(color.r)} ${clampByte(color.g)} ${clampByte(color.b)}`);
  }
  return `${lines.join('\r\n')}\r\n`;
}
