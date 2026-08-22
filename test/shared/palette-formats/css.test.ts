import { parseCss, serializeCss } from '../../../src/shared/palette-formats/css';
import { Palette, PaletteParseError } from '../../../src/shared/palette-formats/types';

const VALID_CSS = [':root {', '  --rojo: #FF0000;', '  --verde: #00FF00;', '}'].join('\n');

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
  it('extrae solo los valores hexadecimales, descartando el nombre de variable', () => {
    const palette = parseCss(VALID_CSS, '/tmp/MyPalette.css');
    expect(palette.name).toBe('MyPalette');
    expect(palette.sourceFormat).toBe('css');
    expect(palette.colors).toHaveLength(2);
    expect(palette.colors[0]).toMatchObject({ r: 255, g: 0, b: 0, hex: '#FF0000' });
    expect(palette.colors.every((color) => color.name === undefined)).toBe(true);
  });

  it('ignora líneas que no son declaraciones de color', () => {
    const content = [':root {', '  /* comentario */', '  --spacing: 4px;', '  --azul: #0000FF;', '}'].join('\n');
    const palette = parseCss(content, 'test.css');
    expect(palette.colors).toHaveLength(1);
  });

  it('es insensible a mayúsculas en el hexadecimal', () => {
    const palette = parseCss('--x: #ff0000;', 'test.css');
    expect(palette.colors[0].hex).toBe('#FF0000');
  });

  it('lanza PaletteParseError si no hay ninguna declaración de color válida', () => {
    expect(() => parseCss(':root {\n}', 'test.css')).toThrow(PaletteParseError);
  });
});

describe('serializeCss', () => {
  it('produce un bloque :root con una variable por color', () => {
    const palette = makePalette([{ r: 255, g: 0, b: 0 }]);
    const serialized = serializeCss(palette);
    expect(serialized.startsWith(':root {\n')).toBe(true);
    expect(serialized.endsWith('}\n')).toBe(true);
    expect(serialized).toContain('  --color-1: #FF0000;');
  });

  it('genera el slug a partir del nombre del color', () => {
    const palette = makePalette([{ r: 255, g: 0, b: 0, name: 'Rojo Vivo' }]);
    expect(serializeCss(palette)).toContain('--rojo-vivo:');
  });

  it('elimina acentos y símbolos al generar el slug', () => {
    const palette = makePalette([{ r: 0, g: 0, b: 0, name: 'Café Claro!' }]);
    expect(serializeCss(palette)).toContain('--cafe-claro:');
  });

  it('usa color-N por posición para colores sin nombre, intercalados con nombrados', () => {
    const palette = makePalette([
      { r: 255, g: 0, b: 0, name: 'Rojo' },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255, name: 'Azul' }
    ]);
    const serialized = serializeCss(palette);
    expect(serialized).toContain('--rojo:');
    expect(serialized).toContain('--color-2:');
    expect(serialized).toContain('--azul:');
  });

  it('desambigua nombres duplicados añadiendo la posición', () => {
    const palette = makePalette([
      { r: 255, g: 0, b: 0, name: 'Rojo' },
      { r: 200, g: 0, b: 0, name: 'Rojo' }
    ]);
    const serialized = serializeCss(palette);
    expect(serialized).toContain('--rojo:');
    expect(serialized).toContain('--rojo-2:');
  });

  it('serializa una paleta vacía como un bloque :root sin variables', () => {
    const palette = makePalette([]);
    expect(serializeCss(palette)).toBe(':root {\n\n}\n');
  });
});
