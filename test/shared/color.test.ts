import { clampByte, hexToRgb, hslToRgb, hsvToRgb, rgbToHex, rgbToHsl, rgbToHsv } from '../../src/shared/color';

describe('clampByte', () => {
  it('deja sin cambios los valores dentro de rango', () => {
    expect(clampByte(128)).toBe(128);
  });

  it('recorta valores negativos a 0', () => {
    expect(clampByte(-10)).toBe(0);
  });

  it('recorta valores mayores que 255 a 255', () => {
    expect(clampByte(300)).toBe(255);
  });
});

describe('rgbToHex', () => {
  it('convierte 0,0,0 a #000000', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('convierte 255,255,255 a #FFFFFF', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });

  it('convierte 255,0,0 a #FF0000', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
  });
});

describe('hexToRgb', () => {
  it('convierte #FF0000 a {255,0,0}', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('acepta hex en minúsculas y sin #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('lanza un error si el hex no es válido', () => {
    expect(() => hexToRgb('no-valido')).toThrow();
  });
});

describe('rgbToHsl', () => {
  it('convierte 255,0,0 a hsl(0,100,50)', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('convierte 255,255,255 a hsl(0,0,100)', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('convierte 0,0,0 a hsl(0,0,0)', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('convierte 128,128,128 a hsl(0,0,50)', () => {
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('hslToRgb', () => {
  it('convierte hsl(0,100,50) a 255,0,0', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('convierte hsl(0,0,100) a 255,255,255', () => {
    expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('convierte hsl(0,0,0) a 0,0,0', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('hace round-trip con rgbToHsl para un color no trivial', () => {
    const original = { r: 200, g: 80, b: 40 };
    const { h, s, l } = rgbToHsl(original.r, original.g, original.b);
    const roundTripped = hslToRgb(h, s, l);
    expect(roundTripped.r).toBeGreaterThanOrEqual(original.r - 1);
    expect(roundTripped.r).toBeLessThanOrEqual(original.r + 1);
    expect(roundTripped.g).toBeGreaterThanOrEqual(original.g - 1);
    expect(roundTripped.g).toBeLessThanOrEqual(original.g + 1);
    expect(roundTripped.b).toBeGreaterThanOrEqual(original.b - 1);
    expect(roundTripped.b).toBeLessThanOrEqual(original.b + 1);
  });
});

describe('rgbToHsv', () => {
  it('convierte 255,0,0 a hsv(0,100,100)', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
  });

  it('convierte 255,255,255 a hsv(0,0,100)', () => {
    expect(rgbToHsv(255, 255, 255)).toEqual({ h: 0, s: 0, v: 100 });
  });

  it('convierte 0,0,0 a hsv(0,0,0)', () => {
    expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
  });

  it('convierte 128,128,128 a hsv(0,0,50)', () => {
    expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 50 });
  });
});

describe('hsvToRgb', () => {
  it('convierte hsv(0,100,100) a 255,0,0', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('convierte hsv(0,0,100) a 255,255,255', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('convierte hsv(0,0,0) a 0,0,0', () => {
    expect(hsvToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('hace round-trip con rgbToHsv para un color no trivial', () => {
    const original = { r: 200, g: 80, b: 40 };
    const { h, s, v } = rgbToHsv(original.r, original.g, original.b);
    const roundTripped = hsvToRgb(h, s, v);
    expect(roundTripped.r).toBeGreaterThanOrEqual(original.r - 1);
    expect(roundTripped.r).toBeLessThanOrEqual(original.r + 1);
    expect(roundTripped.g).toBeGreaterThanOrEqual(original.g - 1);
    expect(roundTripped.g).toBeLessThanOrEqual(original.g + 1);
    expect(roundTripped.b).toBeGreaterThanOrEqual(original.b - 1);
    expect(roundTripped.b).toBeLessThanOrEqual(original.b + 1);
  });
});
