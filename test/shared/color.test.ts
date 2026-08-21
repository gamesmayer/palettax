import { clampByte, hexToRgb, rgbToHex } from '../../src/shared/color';

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
