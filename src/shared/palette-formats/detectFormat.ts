import { PaletteFormat } from './types';

export function detectFormatByExtension(fileName: string): PaletteFormat | null {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) {
    return null;
  }
  const extension = match[1];
  if (extension === 'pal') return 'pal';
  if (extension === 'gpl') return 'gpl';
  return null;
}
