import {
  blendRgb,
  clampByte,
  cmykToRgb,
  generateShadesAndTints,
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv
} from '../../src/shared/color';

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

describe('rgbToCmyk', () => {
  it('converts 255,0,0 to cmyk(0,100,100,0)', () => {
    expect(rgbToCmyk(255, 0, 0)).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });

  it('converts 0,255,0 to cmyk(100,0,100,0)', () => {
    expect(rgbToCmyk(0, 255, 0)).toEqual({ c: 100, m: 0, y: 100, k: 0 });
  });

  it('converts 0,0,255 to cmyk(100,100,0,0)', () => {
    expect(rgbToCmyk(0, 0, 255)).toEqual({ c: 100, m: 100, y: 0, k: 0 });
  });

  it('converts 255,255,255 to cmyk(0,0,0,0)', () => {
    expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
  });

  it('converts 0,0,0 to cmyk(0,0,0,100)', () => {
    expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it('converts 128,128,128 to cmyk(0,0,0,50)', () => {
    expect(rgbToCmyk(128, 128, 128)).toEqual({ c: 0, m: 0, y: 0, k: 50 });
  });
});

describe('cmykToRgb', () => {
  it('converts cmyk(0,100,100,0) to 255,0,0', () => {
    expect(cmykToRgb(0, 100, 100, 0)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts cmyk(0,0,0,0) to 255,255,255', () => {
    expect(cmykToRgb(0, 0, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts cmyk(0,0,0,100) to 0,0,0', () => {
    expect(cmykToRgb(0, 0, 0, 100)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('round-trips with rgbToCmyk for a non-trivial color', () => {
    const original = { r: 200, g: 80, b: 40 };
    const { c, m, y, k } = rgbToCmyk(original.r, original.g, original.b);
    const roundTripped = cmykToRgb(c, m, y, k);
    expect(roundTripped.r).toBeGreaterThanOrEqual(original.r - 1);
    expect(roundTripped.r).toBeLessThanOrEqual(original.r + 1);
    expect(roundTripped.g).toBeGreaterThanOrEqual(original.g - 1);
    expect(roundTripped.g).toBeLessThanOrEqual(original.g + 1);
    expect(roundTripped.b).toBeGreaterThanOrEqual(original.b - 1);
    expect(roundTripped.b).toBeLessThanOrEqual(original.b + 1);
  });
});

describe('blendRgb', () => {
  it('returns the requested number of steps', () => {
    expect(blendRgb({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 5)).toHaveLength(5);
  });

  it('starts and ends exactly on the source colors', () => {
    const start = { r: 255, g: 0, b: 0 };
    const end = { r: 0, g: 0, b: 255 };
    const result = blendRgb(start, end, 5);
    expect(result[0]).toEqual(start);
    expect(result[result.length - 1]).toEqual(end);
  });

  it('interpolates linearly in RGB space for the midpoint of 3 steps', () => {
    const result = blendRgb({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 }, 3);
    expect(result[1]).toEqual({ r: 50, g: 100, b: 25 });
  });

  it('produces the same color at every step when blending a color with itself', () => {
    const color = { r: 128, g: 64, b: 32 };
    const result = blendRgb(color, color, 4);
    result.forEach((step) => expect(step).toEqual(color));
  });
});

describe('generateShadesAndTints', () => {
  const base = { r: 100, g: 150, b: 200 };
  const baseHsl = rgbToHsl(base.r, base.g, base.b);

  it('returns the requested number of shades and tints', () => {
    const { shades, tints } = generateShadesAndTints(base, 3, 2, 10);
    expect(shades).toHaveLength(3);
    expect(tints).toHaveLength(2);
  });

  it('returns empty arrays when a count is 0', () => {
    const { shades, tints } = generateShadesAndTints(base, 0, 0, 10);
    expect(shades).toEqual([]);
    expect(tints).toEqual([]);
  });

  it('does not jump straight to pure black/white for a small count', () => {
    const { shades, tints } = generateShadesAndTints(base, 1, 1, 10);
    expect(shades[0]).not.toEqual({ r: 0, g: 0, b: 0 });
    expect(tints[0]).not.toEqual({ r: 255, g: 255, b: 255 });
  });

  it('steps lightness down by the given amount per shade, darkest first', () => {
    const { shades } = generateShadesAndTints(base, 3, 0, 10);
    const lightnesses = shades.map((color) => rgbToHsl(color.r, color.g, color.b).l);
    expect(lightnesses).toEqual([...lightnesses].sort((a, b) => a - b));
    expect(lightnesses[lightnesses.length - 1]).toBeLessThan(baseHsl.l);
  });

  it('steps lightness up by the given amount per tint, lightest last', () => {
    const { tints } = generateShadesAndTints(base, 0, 3, 10);
    const lightnesses = tints.map((color) => rgbToHsl(color.r, color.g, color.b).l);
    expect(lightnesses).toEqual([...lightnesses].sort((a, b) => a - b));
    expect(lightnesses[0]).toBeGreaterThan(baseHsl.l);
  });

  it('clamps lightness at 0 and 100 instead of overshooting', () => {
    const { shades, tints } = generateShadesAndTints(base, 10, 10, 10);
    shades.forEach((color) => expect(rgbToHsl(color.r, color.g, color.b).l).toBeGreaterThanOrEqual(0));
    tints.forEach((color) => expect(rgbToHsl(color.r, color.g, color.b).l).toBeLessThanOrEqual(100));
  });
});
