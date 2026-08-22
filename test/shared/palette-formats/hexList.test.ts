import { parseHexTxt, serializeHexTxt } from '../../../src/shared/palette-formats/hexList';
import { PaletteParseError } from '../../../src/shared/palette-formats/types';

const VALID_TXT = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF'].join('\n');

describe('parseHexTxt', () => {
  it('parsea una lista de colores hexadecimales, uno por línea', () => {
    const palette = parseHexTxt(VALID_TXT, '/tmp/MyPalette.txt');
    expect(palette.name).toBe('MyPalette');
    expect(palette.sourceFormat).toBe('txt');
    expect(palette.colors).toHaveLength(4);
    expect(palette.colors[0]).toMatchObject({ r: 255, g: 0, b: 0, hex: '#FF0000' });
    expect(palette.colors[3]).toMatchObject({ r: 255, g: 255, b: 255, hex: '#FFFFFF' });
    expect(palette.colors.every((color) => color.name === undefined)).toBe(true);
  });

  it('es tolerante y descarta líneas que no son un hexadecimal válido', () => {
    const content = ['#FF0000', 'esto no es un color', '#00FF00'].join('\n');
    const palette = parseHexTxt(content, 'test.txt');
    expect(palette.colors).toHaveLength(2);
  });

  it('es insensible a mayúsculas y normaliza la salida', () => {
    const palette = parseHexTxt('#ff0000', 'test.txt');
    expect(palette.colors[0].hex).toBe('#FF0000');
  });

  it('lanza PaletteParseError si no hay ningún color válido', () => {
    expect(() => parseHexTxt('esto no es un color', 'test.txt')).toThrow(PaletteParseError);
  });
});

describe('serializeHexTxt', () => {
  it('serializa solo el hexadecimal, descartando cualquier nombre', () => {
    const palette = parseHexTxt(VALID_TXT, 'test.txt');
    const serialized = serializeHexTxt({
      ...palette,
      colors: palette.colors.map((color) => ({ ...color, name: 'Ignorado' }))
    });
    expect(serialized).not.toContain('Ignorado');
    expect(serialized.trim().split('\n')).toEqual(['#FF0000', '#00FF00', '#0000FF', '#FFFFFF']);
  });

  it('hace round-trip manteniendo los mismos colores y orden', () => {
    const original = parseHexTxt(VALID_TXT, 'test.txt');
    const roundTripped = parseHexTxt(serializeHexTxt(original), 'test.txt');
    expect(roundTripped.colors.map(({ r, g, b }) => ({ r, g, b }))).toEqual(
      original.colors.map(({ r, g, b }) => ({ r, g, b }))
    );
  });
});
