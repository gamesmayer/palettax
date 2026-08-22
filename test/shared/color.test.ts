import { clampByte, hexToRgb, hslToRgb, hsvToRgb, rgbToHex, rgbToHsl, rgbToHsv } from '../../src/shared/color';

describe('clampByte', () => {
  it('leaves values within range unchanged', () => {
    expect(clampByte(128)).toBe(128);
  });

  it('clamps negative values to 0', () => {
    expect(clampByte(-10)).toBe(0);
  });

  it('clamps values greater than 255 to 255', () => {
    expect(clampByte(300)).toBe(255);
  });
});

describe('rgbToHex', () => {
  it('converts 0,0,0 to #000000', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts 255,255,255 to #FFFFFF', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
  });

  it('converts 255,0,0 to #FF0000', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
  });
});

describe('hexToRgb', () => {
  it('converts #FF0000 to {255,0,0}', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('accepts lowercase hex without a #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('throws an error if the hex is not valid', () => {
    expect(() => hexToRgb('not-valid')).toThrow();
  });
});

describe('rgbToHsl', () => {
  it('converts 255,0,0 to hsl(0,100,50)', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts 255,255,255 to hsl(0,0,100)', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts 0,0,0 to hsl(0,0,0)', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts 128,128,128 to hsl(0,0,50)', () => {
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('hslToRgb', () => {
  it('converts hsl(0,100,50) to 255,0,0', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts hsl(0,0,100) to 255,255,255', () => {
    expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts hsl(0,0,0) to 0,0,0', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('round-trips with rgbToHsl for a non-trivial color', () => {
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
  it('converts 255,0,0 to hsv(0,100,100)', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
  });

  it('converts 255,255,255 to hsv(0,0,100)', () => {
    expect(rgbToHsv(255, 255, 255)).toEqual({ h: 0, s: 0, v: 100 });
  });

  it('converts 0,0,0 to hsv(0,0,0)', () => {
    expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
  });

  it('converts 128,128,128 to hsv(0,0,50)', () => {
    expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 50 });
  });
});

describe('hsvToRgb', () => {
  it('converts hsv(0,100,100) to 255,0,0', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts hsv(0,0,100) to 255,255,255', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts hsv(0,0,0) to 0,0,0', () => {
    expect(hsvToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('round-trips with rgbToHsv for a non-trivial color', () => {
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
