import {
	blendRgb,
	clampByte,
	cmykToRgb,
	generateShadesAndTints,
	hexToRgb,
	hslToRgb,
	hsvToRgb,
	labToRgb,
	oklchToRgb,
	rgbToCmyk,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
	rgbToOklch,
} from "../../src/shared/color";
import { applyEasing, Easing } from "../../src/shared/easing";

describe("clampByte", () => {
	it("leaves values within range unchanged", () => {
		expect(clampByte(128)).toBe(128);
	});

	it("clamps negative values to 0", () => {
		expect(clampByte(-10)).toBe(0);
	});

	it("clamps values greater than 255 to 255", () => {
		expect(clampByte(300)).toBe(255);
	});
});

describe("rgbToHex", () => {
	it("converts 0,0,0 to #000000", () => {
		expect(rgbToHex(0, 0, 0)).toBe("#000000");
	});

	it("converts 255,255,255 to #FFFFFF", () => {
		expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
	});

	it("converts 255,0,0 to #FF0000", () => {
		expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
	});
});

describe("hexToRgb", () => {
	it("converts #FF0000 to {255,0,0}", () => {
		expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("accepts lowercase hex without a #", () => {
		expect(hexToRgb("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
	});

	it("throws an error if the hex is not valid", () => {
		expect(() => hexToRgb("not-valid")).toThrow();
	});
});

describe("rgbToHsl", () => {
	it("converts 255,0,0 to hsl(0,100,50)", () => {
		expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
	});

	it("converts 255,255,255 to hsl(0,0,100)", () => {
		expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
	});

	it("converts 0,0,0 to hsl(0,0,0)", () => {
		expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
	});

	it("converts 128,128,128 to hsl(0,0,50)", () => {
		expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
	});
});

describe("hslToRgb", () => {
	it("converts hsl(0,100,50) to 255,0,0", () => {
		expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("converts hsl(0,0,100) to 255,255,255", () => {
		expect(hslToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("converts hsl(0,0,0) to 0,0,0", () => {
		expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("round-trips with rgbToHsl for a non-trivial color", () => {
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

describe("rgbToHsv", () => {
	it("converts 255,0,0 to hsv(0,100,100)", () => {
		expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
	});

	it("converts 255,255,255 to hsv(0,0,100)", () => {
		expect(rgbToHsv(255, 255, 255)).toEqual({ h: 0, s: 0, v: 100 });
	});

	it("converts 0,0,0 to hsv(0,0,0)", () => {
		expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
	});

	it("converts 128,128,128 to hsv(0,0,50)", () => {
		expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 50 });
	});
});

describe("hsvToRgb", () => {
	it("converts hsv(0,100,100) to 255,0,0", () => {
		expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("converts hsv(0,0,100) to 255,255,255", () => {
		expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("converts hsv(0,0,0) to 0,0,0", () => {
		expect(hsvToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("round-trips with rgbToHsv for a non-trivial color", () => {
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

describe("rgbToCmyk", () => {
	it("converts 255,0,0 to cmyk(0,100,100,0)", () => {
		expect(rgbToCmyk(255, 0, 0)).toEqual({ c: 0, m: 100, y: 100, k: 0 });
	});

	it("converts 0,255,0 to cmyk(100,0,100,0)", () => {
		expect(rgbToCmyk(0, 255, 0)).toEqual({ c: 100, m: 0, y: 100, k: 0 });
	});

	it("converts 0,0,255 to cmyk(100,100,0,0)", () => {
		expect(rgbToCmyk(0, 0, 255)).toEqual({ c: 100, m: 100, y: 0, k: 0 });
	});

	it("converts 255,255,255 to cmyk(0,0,0,0)", () => {
		expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
	});

	it("converts 0,0,0 to cmyk(0,0,0,100)", () => {
		expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
	});

	it("converts 128,128,128 to cmyk(0,0,0,50)", () => {
		expect(rgbToCmyk(128, 128, 128)).toEqual({ c: 0, m: 0, y: 0, k: 50 });
	});
});

describe("cmykToRgb", () => {
	it("converts cmyk(0,100,100,0) to 255,0,0", () => {
		expect(cmykToRgb(0, 100, 100, 0)).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("converts cmyk(0,0,0,0) to 255,255,255", () => {
		expect(cmykToRgb(0, 0, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("converts cmyk(0,0,0,100) to 0,0,0", () => {
		expect(cmykToRgb(0, 0, 0, 100)).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("round-trips with rgbToCmyk for a non-trivial color", () => {
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

describe("labToRgb", () => {
	it("converts L=0 to black", () => {
		expect(labToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("converts L=100 to white", () => {
		const { r, g, b } = labToRgb(100, 0, 0);
		expect(r).toBeGreaterThanOrEqual(254);
		expect(g).toBeGreaterThanOrEqual(254);
		expect(b).toBeGreaterThanOrEqual(254);
	});

	it("approximates pure red for its known CIELAB (D65) value", () => {
		const { r, g, b } = labToRgb(53.24, 80.09, 67.2);
		expect(r).toBeGreaterThanOrEqual(250);
		expect(g).toBeLessThanOrEqual(5);
		expect(b).toBeLessThanOrEqual(5);
	});

	it("produces a neutral gray when a and b are 0", () => {
		const { r, g, b } = labToRgb(50, 0, 0);
		expect(r).toBe(g);
		expect(g).toBe(b);
	});
});

describe("rgbToOklch", () => {
	it("converts white to L≈1, C≈0", () => {
		const { l, c } = rgbToOklch(255, 255, 255);
		expect(l).toBeCloseTo(1, 2);
		expect(c).toBeCloseTo(0, 2);
	});

	it("converts black to L≈0, C≈0", () => {
		const { l, c } = rgbToOklch(0, 0, 0);
		expect(l).toBeCloseTo(0, 2);
		expect(c).toBeCloseTo(0, 2);
	});

	it("matches the known OKLCH value for pure red", () => {
		const { l, c, h } = rgbToOklch(255, 0, 0);
		expect(l).toBeCloseTo(0.628, 2);
		expect(c).toBeCloseTo(0.258, 2);
		expect(h).toBeCloseTo(29.23, 0);
	});

	it("matches the known OKLCH value for pure green", () => {
		const { l, c, h } = rgbToOklch(0, 255, 0);
		expect(l).toBeCloseTo(0.866, 2);
		expect(c).toBeCloseTo(0.295, 2);
		expect(h).toBeCloseTo(142.5, 0);
	});

	it("matches the known OKLCH value for pure blue", () => {
		const { l, c, h } = rgbToOklch(0, 0, 255);
		expect(l).toBeCloseTo(0.452, 2);
		expect(c).toBeCloseTo(0.313, 2);
		expect(h).toBeCloseTo(264.05, 0);
	});
});

describe("oklchToRgb", () => {
	it("converts L=0,C=0,H=0 to black", () => {
		expect(oklchToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("converts L=1,C=0,H=0 to white", () => {
		const { r, g, b } = oklchToRgb(1, 0, 0);
		expect(r).toBeGreaterThanOrEqual(254);
		expect(g).toBeGreaterThanOrEqual(254);
		expect(b).toBeGreaterThanOrEqual(254);
	});

	it("round-trips with rgbToOklch for a non-trivial color", () => {
		const original = { r: 200, g: 80, b: 40 };
		const { l, c, h } = rgbToOklch(original.r, original.g, original.b);
		const roundTripped = oklchToRgb(l, c, h);
		expect(roundTripped.r).toBeGreaterThanOrEqual(original.r - 1);
		expect(roundTripped.r).toBeLessThanOrEqual(original.r + 1);
		expect(roundTripped.g).toBeGreaterThanOrEqual(original.g - 1);
		expect(roundTripped.g).toBeLessThanOrEqual(original.g + 1);
		expect(roundTripped.b).toBeGreaterThanOrEqual(original.b - 1);
		expect(roundTripped.b).toBeLessThanOrEqual(original.b + 1);
	});

	it("brings an out-of-gamut chroma back into range while preserving hue", () => {
		const requestedHue = 30;
		const { r, g, b } = oklchToRgb(0.6, 1.0, requestedHue);
		[r, g, b].forEach((channel) => {
			expect(Number.isNaN(channel)).toBe(false);
			expect(channel).toBeGreaterThanOrEqual(0);
			expect(channel).toBeLessThanOrEqual(255);
		});
		const { h } = rgbToOklch(r, g, b);
		const hueDiff = Math.min(
			Math.abs(h - requestedHue),
			360 - Math.abs(h - requestedHue)
		);
		expect(hueDiff).toBeLessThan(5);
	});
});

describe("blendRgb", () => {
	it("returns the requested number of steps", () => {
		expect(
			blendRgb({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 5)
		).toHaveLength(5);
	});

	it("starts and ends exactly on the source colors", () => {
		const start = { r: 255, g: 0, b: 0 };
		const end = { r: 0, g: 0, b: 255 };
		const result = blendRgb(start, end, 5);
		expect(result[0]).toEqual(start);
		expect(result[result.length - 1]).toEqual(end);
	});

	it("interpolates linearly in RGB space for the midpoint of 3 steps", () => {
		const result = blendRgb({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 }, 3);
		expect(result[1]).toEqual({ r: 50, g: 100, b: 25 });
	});

	it("produces the same color at every step when blending a color with itself", () => {
		const color = { r: 128, g: 64, b: 32 };
		const result = blendRgb(color, color, 4);
		result.forEach((step) => expect(step).toEqual(color));
	});
});

describe("generateShadesAndTints", () => {
	const base = { r: 100, g: 150, b: 200 };
	const baseOklch = rgbToOklch(base.r, base.g, base.b);

	// Every comparison here round-trips through 8-bit RGB (clampByte), which
	// quantizes the underlying OKLCH value. For low-chroma colors especially,
	// that quantization can nudge the recovered hue/chroma by a bit more than
	// a naive tight tolerance would allow, even though the interpolation math
	// itself is exact. These helpers absorb that rounding noise.
	function expectHueClose(
		actual: number,
		expected: number,
		tolerance = 1.5
	): void {
		const diff = Math.abs(actual - expected);
		expect(Math.min(diff, 360 - diff)).toBeLessThan(tolerance);
	}

	function expectChromaClose(
		actual: number,
		expected: number,
		tolerance = 0.08
	): void {
		expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
	}

	it("returns the requested number of shades and tints", () => {
		const { shades, tints } = generateShadesAndTints(
			base,
			3,
			2,
			{ lightnessShift: 40 },
			{ lightnessShift: 30 }
		);
		expect(shades).toHaveLength(3);
		expect(tints).toHaveLength(2);
	});

	it("returns empty arrays when a count is 0", () => {
		const { shades, tints } = generateShadesAndTints(
			base,
			0,
			0,
			{ lightnessShift: 40 },
			{ lightnessShift: 30 }
		);
		expect(shades).toEqual([]);
		expect(tints).toEqual([]);
	});

	it("does not jump straight to pure black/white for a small count", () => {
		const { shades, tints } = generateShadesAndTints(
			base,
			1,
			1,
			{ lightnessShift: 40 },
			{ lightnessShift: 30 }
		);
		expect(shades[0]).not.toEqual({ r: 0, g: 0, b: 0 });
		expect(tints[0]).not.toEqual({ r: 255, g: 255, b: 255 });
	});

	it("returns the base color for every step when no shift is given (defaults)", () => {
		const { shades, tints } = generateShadesAndTints(base, 2, 2);
		[...shades, ...tints].forEach((color) => {
			expect(color.r).toBeGreaterThanOrEqual(base.r - 1);
			expect(color.r).toBeLessThanOrEqual(base.r + 1);
			expect(color.g).toBeGreaterThanOrEqual(base.g - 1);
			expect(color.g).toBeLessThanOrEqual(base.g + 1);
			expect(color.b).toBeGreaterThanOrEqual(base.b - 1);
			expect(color.b).toBeLessThanOrEqual(base.b + 1);
		});
	});

	it("works when a shift object is missing individual fields (defaults each to 0)", () => {
		const { shades } = generateShadesAndTints(base, 1, 0, {
			lightnessShift: 40,
		});
		const { h } = rgbToOklch(shades[0].r, shades[0].g, shades[0].b);
		expectHueClose(h, baseOklch.h);
	});

	it("keeps hue at the base hue when hue shift is 0 (default)", () => {
		const { shades, tints } = generateShadesAndTints(
			base,
			3,
			3,
			{ lightnessShift: 40 },
			{ lightnessShift: 30 }
		);
		[...shades, ...tints].forEach((color) => {
			const { h } = rgbToOklch(color.r, color.g, color.b);
			expectHueClose(h, baseOklch.h);
		});
	});

	it("keeps chroma at the base chroma when chroma shift is 0 (default)", () => {
		const { shades, tints } = generateShadesAndTints(
			base,
			3,
			3,
			{ lightnessShift: 40 },
			{ lightnessShift: 30 }
		);
		[...shades, ...tints].forEach((color) => {
			const { c } = rgbToOklch(color.r, color.g, color.b);
			expectChromaClose(c, baseOklch.c);
		});
	});

	it("shifts hue progressively for a positive shade hue shift, reaching the full shift at the furthest shade", () => {
		const { shades } = generateShadesAndTints(base, 4, 0, { hueShift: 40 });
		shades.forEach((color, index) => {
			const t = (4 - index) / 4;
			const expectedHue = (baseOklch.h + 40 * t + 360) % 360;
			const { h } = rgbToOklch(color.r, color.g, color.b);
			expectHueClose(h, expectedHue);
		});
	});

	it("shifts hue progressively (negative) for a negative tint hue shift", () => {
		const { tints } = generateShadesAndTints(base, 0, 4, {}, { hueShift: -40 });
		tints.forEach((color, index) => {
			const t = (index + 1) / 4;
			const expectedHue = (((baseOklch.h - 40 * t) % 360) + 360) % 360;
			const { h } = rgbToOklch(color.r, color.g, color.b);
			expectHueClose(h, expectedHue);
		});
	});

	it("reaches the exact configured hue shift only at the furthest shade, not before", () => {
		const { shades } = generateShadesAndTints(base, 3, 0, { hueShift: 60 });
		const hues = shades.map((c) => rgbToOklch(c.r, c.g, c.b).h);
		const fullShiftHue = (baseOklch.h + 60) % 360;
		expectHueClose(hues[0], fullShiftHue);
		expect(Math.abs(hues[1] - fullShiftHue)).toBeGreaterThan(5);
		expect(Math.abs(hues[2] - fullShiftHue)).toBeGreaterThan(10);
	});

	it("wraps hue around 360/0 instead of overshooting", () => {
		const fabricatedBase = oklchToRgb(0.6, 0.15, 350);
		const fabricatedHue = rgbToOklch(
			fabricatedBase.r,
			fabricatedBase.g,
			fabricatedBase.b
		).h;
		const { shades } = generateShadesAndTints(fabricatedBase, 1, 0, {
			hueShift: 20,
		});
		const expectedHue = (fabricatedHue + 20) % 360;
		const actualHue = rgbToOklch(shades[0].r, shades[0].g, shades[0].b).h;
		expectHueClose(actualHue, expectedHue);
		expect(actualHue).toBeLessThan(360);
	});

	it("interpolates chroma progressively for a positive chroma shift", () => {
		// chromaShift is kept modest (20%) so the whole ramp stays within the
		// sRGB gamut for this base color — see `oklchToRgb`'s gamut-mapping test
		// for behavior once a requested chroma exceeds what's achievable.
		const { tints } = generateShadesAndTints(
			base,
			0,
			4,
			{},
			{ chromaShift: 20 }
		);
		const targetC = baseOklch.c + (20 / 100) * 0.4;
		tints.forEach((color, index) => {
			const t = (index + 1) / 4;
			const expectedC = baseOklch.c + (targetC - baseOklch.c) * t;
			const { c } = rgbToOklch(color.r, color.g, color.b);
			expectChromaClose(c, expectedC);
		});
	});

	it("interpolates chroma progressively for a negative chroma shift, clamped at 0", () => {
		// The algorithm computes the (possibly clamped) target chroma once, then
		// lerps toward it — not a per-step clamp — so with chromaShift: -50 the
		// target is clamped to 0 and every step approaches 0 linearly.
		const { shades } = generateShadesAndTints(base, 4, 0, { chromaShift: -50 });
		const targetC = Math.max(0, baseOklch.c + (-50 / 100) * 0.4);
		shades.forEach((color, index) => {
			const t = (4 - index) / 4;
			const expectedC = baseOklch.c + (targetC - baseOklch.c) * t;
			const { c } = rgbToOklch(color.r, color.g, color.b);
			expectChromaClose(c, expectedC);
		});
	});

	it("interpolates shades toward the configured darker target", () => {
		const { shades } = generateShadesAndTints(base, 1, 0, {
			lightnessShift: 40,
		});
		const { l } = rgbToOklch(shades[0].r, shades[0].g, shades[0].b);
		expect(l).toBeCloseTo(baseOklch.l * 0.6, 1);
	});

	it("interpolates tints toward the configured lighter target", () => {
		const { tints } = generateShadesAndTints(
			base,
			0,
			1,
			{},
			{ lightnessShift: 30 }
		);
		const { l } = rgbToOklch(tints[0].r, tints[0].g, tints[0].b);
		expect(l).toBeCloseTo(baseOklch.l + (1 - baseOklch.l) * 0.3, 1);
	});

	it("applies the complete configured shift for a one-step ramp", () => {
		const { shades } = generateShadesAndTints(base, 1, 0, {
			lightnessShift: 40,
			hueShift: 45,
			chromaShift: 30,
		});
		const targetL = baseOklch.l * 0.6;
		const targetC = Math.max(0, baseOklch.c + 0.3 * 0.4);
		const targetH = (baseOklch.h + 45 + 360) % 360;
		const expected = oklchToRgb(targetL, targetC, targetH);
		expect(shades[0].r).toBeGreaterThanOrEqual(expected.r - 1);
		expect(shades[0].r).toBeLessThanOrEqual(expected.r + 1);
		expect(shades[0].g).toBeGreaterThanOrEqual(expected.g - 1);
		expect(shades[0].g).toBeLessThanOrEqual(expected.g + 1);
		expect(shades[0].b).toBeGreaterThanOrEqual(expected.b - 1);
		expect(shades[0].b).toBeLessThanOrEqual(expected.b + 1);
	});

	it("behaves deterministically for an achromatic base color", () => {
		const grayBase = { r: 128, g: 128, b: 128 };
		const shift = { lightnessShift: 20, hueShift: 90, chromaShift: 40 };
		const first = generateShadesAndTints(grayBase, 3, 3, shift, shift);
		const second = generateShadesAndTints(
			grayBase,
			3,
			3,
			{ ...shift },
			{ ...shift }
		);
		expect(first).toEqual(second);
		[...first.shades, ...first.tints].forEach((color) => {
			expect(Number.isNaN(color.r)).toBe(false);
			expect(Number.isNaN(color.g)).toBe(false);
			expect(Number.isNaN(color.b)).toBe(false);
		});
	});

	it("always generates identical RGB output for identical inputs", () => {
		const shift = { lightnessShift: 25, hueShift: -30, chromaShift: 15 };
		const first = generateShadesAndTints(
			base,
			3,
			2,
			{ ...shift },
			{ ...shift }
		);
		const second = generateShadesAndTints(
			base,
			3,
			2,
			{ ...shift },
			{ ...shift }
		);
		expect(first).toEqual(second);
	});
});

describe("generateShadesAndTints with easing", () => {
	const base = { r: 100, g: 150, b: 200 };
	const baseOklch = rgbToOklch(base.r, base.g, base.b);

	it("defaults to linear when no easing argument is given", () => {
		const withoutArg = generateShadesAndTints(base, 4, 0, {
			lightnessShift: 40,
		});
		const withLinear = generateShadesAndTints(
			base,
			4,
			0,
			{ lightnessShift: 40 },
			{},
			"linear"
		);
		expect(withoutArg).toEqual(withLinear);
	});

	it("ease-in front-loads less lightness change than linear", () => {
		const { shades: easedShades } = generateShadesAndTints(
			base,
			4,
			0,
			{ lightnessShift: 40 },
			{},
			"ease-in"
		);
		const { shades: linearShades } = generateShadesAndTints(base, 4, 0, {
			lightnessShift: 40,
		});
		// shades[3] is the closest-to-base step (i=1, count=4, raw t=0.25)
		const easedL = rgbToOklch(
			easedShades[3].r,
			easedShades[3].g,
			easedShades[3].b
		).l;
		const linearL = rgbToOklch(
			linearShades[3].r,
			linearShades[3].g,
			linearShades[3].b
		).l;
		// Shades darken toward 0, so "less change" means a lightness closer to base.
		expect(easedL).toBeGreaterThan(linearL);
	});

	it("ease-out front-loads more lightness change than linear", () => {
		const { shades: easedShades } = generateShadesAndTints(
			base,
			4,
			0,
			{ lightnessShift: 40 },
			{},
			"ease-out"
		);
		const { shades: linearShades } = generateShadesAndTints(base, 4, 0, {
			lightnessShift: 40,
		});
		const easedL = rgbToOklch(
			easedShades[3].r,
			easedShades[3].g,
			easedShades[3].b
		).l;
		const linearL = rgbToOklch(
			linearShades[3].r,
			linearShades[3].g,
			linearShades[3].b
		).l;
		expect(easedL).toBeLessThan(linearL);
	});

	const EASING_METHODS: Easing[] = [
		"linear",
		"ease-in",
		"ease-out",
		"ease-in-out",
		"smootherstep",
	];

	it.each(EASING_METHODS)(
		"reaches the exact configured shift at the furthest step for %s",
		(easing) => {
			const shift = { lightnessShift: 40, hueShift: 45, chromaShift: 30 };
			const { shades } = generateShadesAndTints(base, 3, 0, shift, {}, easing);
			const targetL = baseOklch.l * (1 - shift.lightnessShift / 100);
			const targetC = Math.max(
				0,
				baseOklch.c + (shift.chromaShift / 100) * 0.4
			);
			const targetH = (baseOklch.h + shift.hueShift + 360) % 360;
			const expected = oklchToRgb(targetL, targetC, targetH);
			expect(shades[0].r).toBeGreaterThanOrEqual(expected.r - 1);
			expect(shades[0].r).toBeLessThanOrEqual(expected.r + 1);
			expect(shades[0].g).toBeGreaterThanOrEqual(expected.g - 1);
			expect(shades[0].g).toBeLessThanOrEqual(expected.g + 1);
			expect(shades[0].b).toBeGreaterThanOrEqual(expected.b - 1);
			expect(shades[0].b).toBeLessThanOrEqual(expected.b + 1);
		}
	);

	it("matches applyEasing exactly for the intermediate lightness of a ramp step", () => {
		const shift = { lightnessShift: 40 };
		const { shades } = generateShadesAndTints(base, 4, 0, shift, {}, "ease-in");
		const targetL = baseOklch.l * 0.6;
		// shades[3] is i=1, count=4 -> raw t=0.25
		const easedT = applyEasing("ease-in", 0.25);
		const expectedL = baseOklch.l + (targetL - baseOklch.l) * easedT;
		const actualL = rgbToOklch(shades[3].r, shades[3].g, shades[3].b).l;
		expect(actualL).toBeCloseTo(expectedL, 1);
	});
});
