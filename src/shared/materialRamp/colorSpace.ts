import { clampByte } from "../color";
import { RgbLinear } from "./types";

// sRGB<->linear helpers here take/return normalized 0-1 floats, unlike
// color.ts's private srgbToLinear/linearToSrgb (byte-in/gamma-out) — a
// different enough convention for the BRDF/GLSL pipeline that reimplementing
// is cleaner than adapting those. clampByte is reused as-is from color.ts.

export function srgbByteToLinear01(byte: number): number {
	const v = byte / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function linear01ToSrgbByte(linear: number): number {
	const clamped = Math.min(1, Math.max(0, linear));
	const gamma =
		clamped <= 0.0031308
			? 12.92 * clamped
			: 1.055 * clamped ** (1 / 2.4) - 0.055;
	return clampByte(gamma * 255);
}

export function rgbBytesToLinear(rgb: {
	r: number;
	g: number;
	b: number;
}): RgbLinear {
	return {
		r: srgbByteToLinear01(rgb.r),
		g: srgbByteToLinear01(rgb.g),
		b: srgbByteToLinear01(rgb.b),
	};
}

export function linearToRgbBytes(rgb: RgbLinear): {
	r: number;
	g: number;
	b: number;
} {
	return {
		r: linear01ToSrgbByte(rgb.r),
		g: linear01ToSrgbByte(rgb.g),
		b: linear01ToSrgbByte(rgb.b),
	};
}

export interface OklabColor {
	L: number;
	a: number;
	b: number;
}

// Same OKLab matrices used by rgbToOklch/oklabToLinearRgb in color.ts, but
// operating directly on linear RGB (no sRGB decode) and returning/accepting
// Cartesian coordinates (no polar conversion, no gamut clamping — this is
// only ever used for perceptual error comparison, never for final color
// production, so out-of-gamut Lab values are fine).

export function rgbLinearToOklab(rgb: RgbLinear): OklabColor {
	const lmsL =
		0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b;
	const lmsM =
		0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b;
	const lmsS =
		0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b;

	const l_ = Math.cbrt(lmsL);
	const m_ = Math.cbrt(lmsM);
	const s_ = Math.cbrt(lmsS);

	return {
		L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
		a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
		b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
	};
}

export function lerpOklab(a: OklabColor, b: OklabColor, t: number): OklabColor {
	return {
		L: a.L + (b.L - a.L) * t,
		a: a.a + (b.a - a.a) * t,
		b: a.b + (b.b - a.b) * t,
	};
}

export function oklabDeltaE(a: OklabColor, b: OklabColor): number {
	const dL = a.L - b.L;
	const da = a.a - b.a;
	const db = a.b - b.b;
	return Math.sqrt(dL * dL + da * da + db * db);
}

// Reinhard tonemap (c / (1+c), per channel, in linear space). Punctual-light
// specular response is inherently unbounded/HDR near the BRDF peak — this is
// standard PBR display-compression practice, not an arbitrary transform. It
// turns "clips to white almost immediately" into a smooth shoulder curve the
// posterizer can meaningfully subdivide.
export function reinhardTonemap(rgb: RgbLinear): RgbLinear {
	return {
		r: rgb.r / (1 + rgb.r),
		g: rgb.g / (1 + rgb.g),
		b: rgb.b / (1 + rgb.b),
	};
}
