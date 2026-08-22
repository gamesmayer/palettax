import { parseCss, serializeCss } from '../../../src/shared/palette-formats/css';
import { Palette, PaletteParseError } from '../../../src/shared/palette-formats/types';

const VALID_CSS = [':root {', '  --red: #FF0000;', '  --green: #00FF00;', '}'].join('\n');

function makePalette(colors: Array<{ r: number; g: number; b: number; name?: string }>): Palette {
  return {
    id: 'p1',
    name: 'Test',
    sourceFormat: 'txt',
    colors: colors.map((color, index) => ({
      id: `c${index}`,
      r: color.r,
      g: color.g,
      b: color.b,
      hex: '',
      name: color.name
    }))
  };
}

describe('parseCss', () => {
  it('extracts only the hex values, discarding the variable name', () => {
    const palette = parseCss(VALID_CSS, '/tmp/MyPalette.css');
    expect(palette.name).toBe('MyPalette');
    expect(palette.sourceFormat).toBe('css');
    expect(palette.colors).toHaveLength(2);
    expect(palette.colors[0]).toMatchObject({ r: 255, g: 0, b: 0, hex: '#FF0000' });
    expect(palette.colors.every((color) => color.name === undefined)).toBe(true);
  });

  it('ignores lines that are not color declarations', () => {
    const content = [':root {', '  /* comment */', '  --spacing: 4px;', '  --blue: #0000FF;', '}'].join('\n');
    const palette = parseCss(content, 'test.css');
    expect(palette.colors).toHaveLength(1);
  });

  it('is case-insensitive for the hex value', () => {
    const palette = parseCss('--x: #ff0000;', 'test.css');
    expect(palette.colors[0].hex).toBe('#FF0000');
  });

  it('throws PaletteParseError if there is no valid color declaration', () => {
    expect(() => parseCss(':root {\n}', 'test.css')).toThrow(PaletteParseError);
  });
});

describe('serializeCss', () => {
  it('produces a :root block with one variable per color', () => {
    const palette = makePalette([{ r: 255, g: 0, b: 0 }]);
    const serialized = serializeCss(palette);
    expect(serialized.startsWith(':root {\n')).toBe(true);
    expect(serialized.endsWith('}\n')).toBe(true);
    expect(serialized).toContain('  --color-1: #FF0000;');
  });

  it('generates the slug from the color name', () => {
    const palette = makePalette([{ r: 255, g: 0, b: 0, name: 'Bright Red' }]);
    expect(serializeCss(palette)).toContain('--bright-red:');
  });

  it('strips accents and symbols when generating the slug', () => {
    const palette = makePalette([{ r: 0, g: 0, b: 0, name: 'Café Noir!' }]);
    expect(serializeCss(palette)).toContain('--cafe-noir:');
  });

  it('uses color-N by position for unnamed colors, interleaved with named ones', () => {
    const palette = makePalette([
      { r: 255, g: 0, b: 0, name: 'Red' },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255, name: 'Blue' }
    ]);
    const serialized = serializeCss(palette);
    expect(serialized).toContain('--red:');
    expect(serialized).toContain('--color-2:');
    expect(serialized).toContain('--blue:');
  });

  it('disambiguates duplicate names by appending the position', () => {
    const palette = makePalette([
      { r: 255, g: 0, b: 0, name: 'Red' },
      { r: 200, g: 0, b: 0, name: 'Red' }
    ]);
    const serialized = serializeCss(palette);
    expect(serialized).toContain('--red:');
    expect(serialized).toContain('--red-2:');
  });

  it('serializes an empty palette as a :root block with no variables', () => {
    const palette = makePalette([]);
    expect(serializeCss(palette)).toBe(':root {\n\n}\n');
  });
});
