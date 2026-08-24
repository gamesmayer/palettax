import { parsePal, serializePal } from '../../../src/shared/palette-formats/jascPal';
import { PaletteParseError } from '../../../src/shared/types';

const VALID_PAL = ['JASC-PAL', '0100', '4', '255 0 0', '0 255 0', '0 0 255', '255 255 255'].join('\r\n');

describe('parsePal', () => {
  it('parses the header, count and colors in order', () => {
    const palette = parsePal(VALID_PAL, '/tmp/MyPalette.pal');
    expect(palette.name).toBe('MyPalette');
    expect(palette.sourceFormat).toBe('pal');
    expect(palette.groups).toHaveLength(1);
    expect(palette.groups[0].colors).toHaveLength(4);
    expect(palette.groups[0].colors[0]).toMatchObject({ r: 255, g: 0, b: 0, hex: '#FF0000' });
    expect(palette.groups[0].colors[3]).toMatchObject({ r: 255, g: 255, b: 255, hex: '#FFFFFF' });
  });

  it('is tolerant when the declared count does not match the actual lines', () => {
    const content = ['JASC-PAL', '0100', '99', '10 20 30'].join('\r\n');
    const palette = parsePal(content, 'test.pal');
    expect(palette.groups[0].colors).toHaveLength(1);
  });

  it('throws PaletteParseError if the JASC-PAL header is missing', () => {
    expect(() => parsePal('not a pal file', 'test.pal')).toThrow(PaletteParseError);
  });
});

describe('serializePal', () => {
  it('produces the correct header, version and count, discarding names', () => {
    const palette = parsePal(VALID_PAL, 'test.pal');
    const serialized = serializePal({
      ...palette,
      groups: [
        {
          ...palette.groups[0],
          colors: palette.groups[0].colors.map((color) => ({ ...color, name: 'Ignored' }))
        }
      ]
    });
    const lines = serialized.trim().split(/\r?\n/);
    expect(lines[0]).toBe('JASC-PAL');
    expect(lines[1]).toBe('0100');
    expect(lines[2]).toBe('4');
    expect(serialized).not.toContain('Ignored');
  });

  it('round-trips keeping the same colors and order', () => {
    const original = parsePal(VALID_PAL, 'test.pal');
    const roundTripped = parsePal(serializePal(original), 'test.pal');
    expect(roundTripped.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))).toEqual(
      original.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))
    );
  });
});
