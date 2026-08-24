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

export function generateShadesAndTints(
	base: { r: number; g: number; b: number },
	shadeCount: number,
	tintCount: number,
	lightnessStep: number
): {
	shades: { r: number; g: number; b: number }[];
	tints: { r: number; g: number; b: number }[];
} {
	const { h, s, l } = rgbToHsl(base.r, base.g, base.b);

	const shades: { r: number; g: number; b: number }[] = [];
	for (let i = shadeCount; i >= 1; i--) {
		shades.push(hslToRgb(h, s, Math.max(0, l - i * lightnessStep)));
	}

	const tints: { r: number; g: number; b: number }[] = [];
	for (let i = 1; i <= tintCount; i++) {
		tints.push(hslToRgb(h, s, Math.min(100, l + i * lightnessStep)));
	}

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
