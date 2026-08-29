import { Easing, applyEasing } from "./easing";

export function clampByte(value: number): number {
	return Math.min(255, Math.max(0, Math.round(value)));
}

export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (value: number): string =>
		clampByte(value).toString(16).padStart(2, "0").toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const normalized = hex.replace("#", "").trim();
	const match = normalized.match(
		/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	);
	if (!match) {
		throw new Error(`Invalid hex color: ${hex}`);
	}
	return {
		r: parseInt(match[1], 16),
		g: parseInt(match[2], 16),
		b: parseInt(match[3], 16),
	};
}

export function generateId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export type ColorSystem = "hex" | "rgb" | "hsl" | "hsb" | "cmyk";

export function rgbToHsl(
	r: number,
	g: number,
	b: number
): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l: Math.round(l * 100) };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	switch (max) {
		case rn:
			h = (gn - bn) / d + (gn < bn ? 6 : 0);
			break;
		case gn:
			h = (bn - rn) / d + 2;
			break;
		default:
			h = (rn - gn) / d + 4;
	}
	h *= 60;

	return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(
	h: number,
	s: number,
	l: number
): { r: number; g: number; b: number } {
	const hn = (((h % 360) + 360) % 360) / 360;
	const sn = s / 100;
	const ln = l / 100;

	if (sn === 0) {
		const v = clampByte(ln * 255);
		return { r: v, g: v, b: v };
	}

	const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
	const p = 2 * ln - q;
	const hueToRgb = (t: number): number => {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};

	return {
		r: clampByte(hueToRgb(hn + 1 / 3) * 255),
		g: clampByte(hueToRgb(hn) * 255),
		b: clampByte(hueToRgb(hn - 1 / 3) * 255),
	};
}

export function rgbToHsv(
	r: number,
	g: number,
	b: number
): { h: number; s: number; v: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const d = max - min;
	const v = max;
	const s = max === 0 ? 0 : d / max;

	let h = 0;
	if (d !== 0) {
		switch (max) {
			case rn:
				h = (gn - bn) / d + (gn < bn ? 6 : 0);
				break;
			case gn:
				h = (bn - rn) / d + 2;
				break;
			default:
				h = (rn - gn) / d + 4;
		}
		h *= 60;
	}

	return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hsvToRgb(
	h: number,
	s: number,
	v: number
): { r: number; g: number; b: number } {
	const hn = ((h % 360) + 360) % 360;
	const sn = s / 100;
	const vn = v / 100;
	const c = vn * sn;
	const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
	const m = vn - c;

	let r1 = 0;
	let g1 = 0;
	let b1 = 0;
	if (hn < 60) {
		[r1, g1, b1] = [c, x, 0];
	} else if (hn < 120) {
		[r1, g1, b1] = [x, c, 0];
	} else if (hn < 180) {
		[r1, g1, b1] = [0, c, x];
	} else if (hn < 240) {
		[r1, g1, b1] = [0, x, c];
	} else if (hn < 300) {
		[r1, g1, b1] = [x, 0, c];
	} else {
		[r1, g1, b1] = [c, 0, x];
	}

	return {
		r: clampByte((r1 + m) * 255),
		g: clampByte((g1 + m) * 255),
		b: clampByte((b1 + m) * 255),
	};
}

export function rgbToCmyk(
	r: number,
	g: number,
	b: number
): { c: number; m: number; y: number; k: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const k = 1 - Math.max(rn, gn, bn);

	if (k === 1) {
		return { c: 0, m: 0, y: 0, k: 100 };
	}

	const c = (1 - rn - k) / (1 - k);
	const m = (1 - gn - k) / (1 - k);
	const y = (1 - bn - k) / (1 - k);

	return {
		c: Math.round(c * 100),
		m: Math.round(m * 100),
		y: Math.round(y * 100),
		k: Math.round(k * 100),
	};
}

/** Formats an RGB color as a display string in the given ColorSystem -- shared by any swatch/chip whose label should reflect the user's chosen system rather than always showing hex. */
export function formatColorForSystem(
	rgb: { r: number; g: number; b: number },
	system: ColorSystem
): string {
	switch (system) {
		case "hex":
			return rgbToHex(rgb.r, rgb.g, rgb.b);
		case "rgb":
			return `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
		case "hsl": {
			const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
			return `HSL(${h}, ${s}%, ${l}%)`;
		}
		case "hsb": {
			const { h, s, v } = rgbToHsv(rgb.r, rgb.g, rgb.b);
			return `HSB(${h}, ${s}%, ${v}%)`;
		}
		case "cmyk": {
			const { c, m, y, k } = rgbToCmyk(rgb.r, rgb.g, rgb.b);
			return `CMYK(${c}%, ${m}%, ${y}%, ${k}%)`;
		}
	}
}

export function blendRgb(
	start: { r: number; g: number; b: number },
	end: { r: number; g: number; b: number },
	steps: number
): { r: number; g: number; b: number }[] {
	const result: { r: number; g: number; b: number }[] = [];
	for (let i = 0; i < steps; i++) {
		const t = i / (steps - 1);
		result.push({
			r: clampByte(start.r + (end.r - start.r) * t),
			g: clampByte(start.g + (end.g - start.g) * t),
			b: clampByte(start.b + (end.b - start.b) * t),
		});
	}
	return result;
}

function linearToSrgb(value: number): number {
	const clamped = Math.min(1, Math.max(0, value));
	return clamped <= 0.0031308
		? 12.92 * clamped
		: 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function srgbToLinear(value: number): number {
	const v = value / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function rgbToOklch(
	r: number,
	g: number,
	b: number
): { l: number; c: number; h: number } {
	const lr = srgbToLinear(r);
	const lg = srgbToLinear(g);
	const lb = srgbToLinear(b);

	const lmsL = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
	const lmsM = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
	const lmsS = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

	const l_ = Math.cbrt(lmsL);
	const m_ = Math.cbrt(lmsM);
	const s_ = Math.cbrt(lmsS);

	const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
	const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
	const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

	const c = Math.sqrt(a * a + b_ * b_);
	let h = (Math.atan2(b_, a) * 180) / Math.PI;
	if (h < 0) h += 360;

	return { l, c, h };
}

function normalizeHue(hue: number): number {
	return ((hue % 360) + 360) % 360;
}

function oklabToLinearRgb(
	L: number,
	a: number,
	b: number
): { r: number; g: number; b: number } {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;

	const lc = l_ ** 3;
	const mc = m_ ** 3;
	const sc = s_ ** 3;

	return {
		r: 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
		g: -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
		b: -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
	};
}

const GAMUT_EPSILON = 1e-4;

function isLinearRgbInGamut(v: { r: number; g: number; b: number }): boolean {
	const inRange = (x: number): boolean =>
		x >= -GAMUT_EPSILON && x <= 1 + GAMUT_EPSILON;
	return inRange(v.r) && inRange(v.g) && inRange(v.b);
}

function encodeLinearRgb(v: { r: number; g: number; b: number }): {
	r: number;
	g: number;
	b: number;
} {
	return {
		r: clampByte(linearToSrgb(v.r) * 255),
		g: clampByte(linearToSrgb(v.g) * 255),
		b: clampByte(linearToSrgb(v.b) * 255),
	};
}

export function oklchToRgb(
	l: number,
	c: number,
	h: number
): { r: number; g: number; b: number } {
	const hRad = (h * Math.PI) / 180;
	const toLinear = (chroma: number): { r: number; g: number; b: number } =>
		oklabToLinearRgb(l, chroma * Math.cos(hRad), chroma * Math.sin(hRad));

	const clampedC = Math.max(0, c);
	let linear = toLinear(clampedC);
	if (!isLinearRgbInGamut(linear)) {
		// Binary search the largest in-gamut chroma at this L/H, holding hue and
		// lightness fixed — avoids the hue distortion that naive per-channel
		// clipping would cause. Achromatic (c=0) is always in gamut, so 0 is a
		// safe lower bound.
		let lo = 0;
		let hi = clampedC;
		for (let i = 0; i < 20; i++) {
			const mid = (lo + hi) / 2;
			if (isLinearRgbInGamut(toLinear(mid))) {
				lo = mid;
			} else {
				hi = mid;
			}
		}
		linear = toLinear(lo);
	}
	return encodeLinearRgb(linear);
}

export interface ShadeTintShift {
	lightnessShift?: number;
	hueShift?: number;
	chromaShift?: number;
}

const MAX_CHROMA_REFERENCE = 0.4;
const ACHROMATIC_CHROMA_EPSILON = 1e-4;

function resolveShift(shift: ShadeTintShift): Required<ShadeTintShift> {
	return {
		lightnessShift: shift.lightnessShift ?? 0,
		hueShift: shift.hueShift ?? 0,
		chromaShift: shift.chromaShift ?? 0,
	};
}

function generateRampSteps(
	baseOklch: { l: number; c: number; h: number },
	count: number,
	targetL: number,
	shift: Required<ShadeTintShift>,
	easing: Easing
): { r: number; g: number; b: number }[] {
	const targetC = Math.max(
		0,
		baseOklch.c + (shift.chromaShift / 100) * MAX_CHROMA_REFERENCE
	);
	// An achromatic (near-gray) base has a meaningless/noisy hue angle (atan2 of
	// two near-zero values) — fall back to a fixed 0° so hue/chroma shifts on a
	// gray base stay deterministic instead of rotating through numerical noise.
	const baseHue = baseOklch.c < ACHROMATIC_CHROMA_EPSILON ? 0 : baseOklch.h;

	const steps: { r: number; g: number; b: number }[] = [];
	for (let i = 1; i <= count; i++) {
		const t = applyEasing(easing, i / count);
		const l = baseOklch.l + (targetL - baseOklch.l) * t;
		const c = baseOklch.c + (targetC - baseOklch.c) * t;
		const h = normalizeHue(baseHue + shift.hueShift * t);
		steps.push(oklchToRgb(l, c, h));
	}
	return steps;
}

export function generateShadesAndTints(
	base: { r: number; g: number; b: number },
	shadeCount: number,
	tintCount: number,
	shadeShift: ShadeTintShift = {},
	tintShift: ShadeTintShift = {},
	easing: Easing = "linear"
): {
	shades: { r: number; g: number; b: number }[];
	tints: { r: number; g: number; b: number }[];
} {
	const baseOklch = rgbToOklch(base.r, base.g, base.b);
	const resolvedShadeShift = resolveShift(shadeShift);
	const resolvedTintShift = resolveShift(tintShift);

	const shadeTargetL =
		baseOklch.l * (1 - resolvedShadeShift.lightnessShift / 100);
	const tintTargetL =
		baseOklch.l + (1 - baseOklch.l) * (resolvedTintShift.lightnessShift / 100);

	// Shades and tints share the exact same ramp-generation function; only the
	// target lightness and shift parameters differ. `generateRampSteps` always
	// returns closest-to-base first, furthest last — shades need the opposite
	// array order (furthest first) to keep the existing dark→base→light preview
	// convention, so it's reversed here rather than duplicating the loop.
	const shades = generateRampSteps(
		baseOklch,
		shadeCount,
		shadeTargetL,
		resolvedShadeShift,
		easing
	).reverse();
	const tints = generateRampSteps(
		baseOklch,
		tintCount,
		tintTargetL,
		resolvedTintShift,
		easing
	);

	return { shades, tints };
}

export function cmykToRgb(
	c: number,
	m: number,
	y: number,
	k: number
): { r: number; g: number; b: number } {
	const cn = c / 100;
	const mn = m / 100;
	const yn = y / 100;
	const kn = k / 100;

	return {
		r: clampByte(255 * (1 - cn) * (1 - kn)),
		g: clampByte(255 * (1 - mn) * (1 - kn)),
		b: clampByte(255 * (1 - yn) * (1 - kn)),
	};
}

const D65_WHITE = { x: 95.047, y: 100.0, z: 108.883 };

function labInverseF(t: number): number {
	const delta = 6 / 29;
	return t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29);
}

export function labToRgb(
	l: number,
	a: number,
	b: number
): { r: number; g: number; b: number } {
	const fy = (l + 16) / 116;
	const fx = fy + a / 500;
	const fz = fy - b / 200;

	const x = D65_WHITE.x * labInverseF(fx);
	const y = D65_WHITE.y * labInverseF(fy);
	const z = D65_WHITE.z * labInverseF(fz);

	const xn = x / 100;
	const yn = y / 100;
	const zn = z / 100;

	const rLinear = 3.2406 * xn - 1.5372 * yn - 0.4986 * zn;
	const gLinear = -0.9689 * xn + 1.8758 * yn + 0.0415 * zn;
	const bLinear = 0.0557 * xn - 0.204 * yn + 1.057 * zn;

	return {
		r: clampByte(linearToSrgb(rLinear) * 255),
		g: clampByte(linearToSrgb(gLinear) * 255),
		b: clampByte(linearToSrgb(bLinear) * 255),
	};
}
