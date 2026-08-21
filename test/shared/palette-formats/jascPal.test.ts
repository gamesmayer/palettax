import { parsePal, serializePal } from '../../../src/shared/palette-formats/jascPal';
import { PaletteParseError } from '../../../src/shared/palette-formats/types';

const VALID_PAL = ['JASC-PAL', '0100', '4', '255 0 0', '0 255 0', '0 0 255', '255 255 255'].join('\r\n');

describe('parsePal', () => {
  it('parsea cabecera, count y colores en orden', () => {
    const palette = parsePal(VALID_PAL, '/tmp/MyPalette.pal');
    expect(palette.name).toBe('MyPalette');
    expect(palette.sourceFormat).toBe('pal');
    expect(palette.colors).toHaveLength(4);
    expect(palette.colors[0]).toMatchObject({ r: 255, g: 0, b: 0, hex: '#FF0000' });
    expect(palette.colors[3]).toMatchObject({ r: 255, g: 255, b: 255, hex: '#FFFFFF' });
  });

  it('es tolerante si el count declarado no coincide con las líneas reales', () => {
    const content = ['JASC-PAL', '0100', '99', '10 20 30'].join('\r\n');
    const palette = parsePal(content, 'test.pal');
    expect(palette.colors).toHaveLength(1);
  });

  it('lanza PaletteParseError si falta la cabecera JASC-PAL', () => {
    expect(() => parsePal('not a pal file', 'test.pal')).toThrow(PaletteParseError);
  });
});

describe('serializePal', () => {
  it('produce cabecera, versión y count correctos, descartando nombres', () => {
    const palette = parsePal(VALID_PAL, 'test.pal');
    const serialized = serializePal({
      ...palette,
      colors: palette.colors.map((color) => ({ ...color, name: 'Ignorado' }))
    });
    const lines = serialized.trim().split(/\r?\n/);
    expect(lines[0]).toBe('JASC-PAL');
    expect(lines[1]).toBe('0100');
    expect(lines[2]).toBe('4');
    expect(serialized).not.toContain('Ignorado');
  });

  it('hace round-trip manteniendo los mismos colores y orden', () => {
    const original = parsePal(VALID_PAL, 'test.pal');
    const roundTripped = parsePal(serializePal(original), 'test.pal');
    expect(roundTripped.colors.map(({ r, g, b }) => ({ r, g, b }))).toEqual(
      original.colors.map(({ r, g, b }) => ({ r, g, b }))
    );
  });
});
