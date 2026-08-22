import { generateId, hexToRgb, rgbToHex } from '../color';
import { Palette, PaletteColor, PaletteParseError } from './types';

function baseNameFromPath(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  return fileName.replace(/\.[^.]+$/, '');
}

const CSS_COLOR_DECLARATION = /^--[\w-]+\s*:\s*(#?[0-9a-fA-F]{6})\s*;?$/;

export function parseCss(content: string, filePath: string): Palette {
  const lines = content.split(/\r?\n/);
  const colors: PaletteColor[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(CSS_COLOR_DECLARATION);
    if (!match) {
      continue;
    }

    const { r, g, b } = hexToRgb(match[1]);
    colors.push({
      id: generateId(),
      r,
      g,
      b,
      hex: rgbToHex(r, g, b)
    });
  }

  if (colors.length === 0) {
    throw new PaletteParseError('El archivo no contiene ninguna declaración de color válida.');
  }

  return {
    id: generateId(),
    name: baseNameFromPath(filePath),
    colors,
    sourceFormat: 'css',
    filePath
  };
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function serializeCss(palette: Palette): string {
  const usedSlugs = new Set<string>();

  const lines = palette.colors.map((color, index) => {
    const position = index + 1;
    const hex = rgbToHex(color.r, color.g, color.b);

    const nameSlug = color.name ? slugify(color.name) : '';
    let slug = nameSlug !== '' ? nameSlug : `color-${position}`;
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${position}`;
    }
    usedSlugs.add(slug);

    return `  --${slug}: ${hex};`;
  });

  return `:root {\n${lines.join('\n')}\n}\n`;
}
