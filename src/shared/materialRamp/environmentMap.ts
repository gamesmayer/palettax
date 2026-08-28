import { convertIndexedToRgb, decode } from "fast-png";
import { srgbByteToLinear01 } from "./colorSpace";
import { RgbLinear, Vec3 } from "./types";

export interface EnvironmentMapLevel {
	width: number;
	height: number;
	pixels: Float32Array; // linear RGB, length width*height*3, row-major
}

// levels[0] is full resolution; each subsequent level is a 2x2 box-downsample
// of the previous one, down to 1x1. This is the CPU-side stand-in for GPU
// mipmaps (see webglStripRenderer.ts, which uses real hardware mipmaps
// instead) -- sampleEnvironment blends between levels based on roughness to
// fake the prefiltered-blur look of a rough reflection without an actual
// convolution.
//
// srgbBytes holds the same full-resolution image as levels[0], but still
// sRGB-encoded (not linearized) -- this is what webglStripRenderer.ts uploads
// as an SRGB8 GPU texture, letting the hardware sampler do the sRGB->linear
// decode instead of duplicating that conversion in GLSL (the CPU mip chain in
// `levels` still needs its own pre-linearized copy since evaluateMaterial's
// CPU path does all its math in linear space).
export interface EnvironmentMap {
	levels: EnvironmentMapLevel[];
	srgbBytes: Uint8Array; // RGB, length width*height*3, row-major, sRGB-encoded
}

interface BaseLevel {
	level: EnvironmentMapLevel;
	srgbBytes: Uint8Array;
}

function buildBaseLevel(bytes: Uint8Array): BaseLevel {
	let decoded: ReturnType<typeof decode>;
	try {
		decoded = decode(bytes);
	} catch {
		throw new Error("The file is not a valid PNG image.");
	}

	const { width, height } = decoded;
	let data = decoded.data;
	let channels = decoded.channels;
	let depth = decoded.depth;

	if (decoded.palette) {
		data = convertIndexedToRgb(decoded);
		channels = decoded.palette[0]?.length ?? 3;
		depth = 8;
	}

	const maxValue = 2 ** depth - 1;
	const pixels = new Float32Array(width * height * 3);
	const srgbBytes = new Uint8Array(width * height * 3);
	for (let i = 0; i < width * height; i++) {
		const srcOffset = i * channels;
		const dstOffset = i * 3;
		const toByte = (value: number): number =>
			Math.round((value / maxValue) * 255);

		const r = toByte(data[srcOffset]);
		const g =
			channels === 1 || channels === 2 ? r : toByte(data[srcOffset + 1]);
		const b =
			channels === 1 || channels === 2 ? r : toByte(data[srcOffset + 2]);

		srgbBytes[dstOffset] = r;
		srgbBytes[dstOffset + 1] = g;
		srgbBytes[dstOffset + 2] = b;
		pixels[dstOffset] = srgbByteToLinear01(r);
		pixels[dstOffset + 1] = srgbByteToLinear01(g);
		pixels[dstOffset + 2] = srgbByteToLinear01(b);
	}

	return { level: { width, height, pixels }, srgbBytes };
}

function downsample(level: EnvironmentMapLevel): EnvironmentMapLevel {
	const width = Math.max(1, Math.floor(level.width / 2));
	const height = Math.max(1, Math.floor(level.height / 2));
	const pixels = new Float32Array(width * height * 3);

	for (let y = 0; y < height; y++) {
		const srcY0 = Math.min(level.height - 1, y * 2);
		const srcY1 = Math.min(level.height - 1, y * 2 + 1);
		for (let x = 0; x < width; x++) {
			const srcX0 = Math.min(level.width - 1, x * 2);
			const srcX1 = Math.min(level.width - 1, x * 2 + 1);
			const dstOffset = (y * width + x) * 3;
			for (let c = 0; c < 3; c++) {
				const sum =
					level.pixels[(srcY0 * level.width + srcX0) * 3 + c] +
					level.pixels[(srcY0 * level.width + srcX1) * 3 + c] +
					level.pixels[(srcY1 * level.width + srcX0) * 3 + c] +
					level.pixels[(srcY1 * level.width + srcX1) * 3 + c];
				pixels[dstOffset + c] = sum / 4;
			}
		}
	}

	return { width, height, pixels };
}

/** Decodes a PNG into an `EnvironmentMap` with a full mip chain down to 1x1. */
export function decodeEnvironmentImage(bytes: Uint8Array): EnvironmentMap {
	const base = buildBaseLevel(bytes);
	const levels: EnvironmentMapLevel[] = [base.level];
	while (
		levels[levels.length - 1].width > 1 ||
		levels[levels.length - 1].height > 1
	) {
		levels.push(downsample(levels[levels.length - 1]));
	}
	return { levels, srgbBytes: base.srgbBytes };
}

/**
 * Maps a world-space direction to equirectangular UV. Must match the GLSL
 * mirror in materialStrip.frag.glsl exactly (see that file's header comment
 * on the existing CPU/GPU sync discipline this codebase already follows for
 * brdf.ts/orientationSweep.ts). Y is up; u wraps around the horizon, v runs
 * top (y=+1) to bottom (y=-1).
 */
export function directionToEquirectUv(dir: Vec3): { u: number; v: number } {
	const rawU = 0.5 + Math.atan2(dir[0], -dir[2]) / (2 * Math.PI);
	const u = rawU - Math.floor(rawU);
	const clampedY = Math.min(1, Math.max(-1, dir[1]));
	const v = Math.min(1, Math.max(0, 0.5 - Math.asin(clampedY) / Math.PI));
	return { u, v };
}

function sampleBilinear(
	level: EnvironmentMapLevel,
	u: number,
	v: number
): RgbLinear {
	const x = u * level.width - 0.5;
	const y = v * level.height - 0.5;
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;

	const wrapX = (xi: number): number =>
		((xi % level.width) + level.width) % level.width;
	const clampY = (yi: number): number =>
		Math.min(level.height - 1, Math.max(0, yi));

	const sampleAt = (xi: number, yi: number): RgbLinear => {
		const offset = (clampY(yi) * level.width + wrapX(xi)) * 3;
		return {
			r: level.pixels[offset],
			g: level.pixels[offset + 1],
			b: level.pixels[offset + 2],
		};
	};

	const c00 = sampleAt(x0, y0);
	const c10 = sampleAt(x0 + 1, y0);
	const c01 = sampleAt(x0, y0 + 1);
	const c11 = sampleAt(x0 + 1, y0 + 1);

	const top = {
		r: c00.r + (c10.r - c00.r) * fx,
		g: c00.g + (c10.g - c00.g) * fx,
		b: c00.b + (c10.b - c00.b) * fx,
	};
	const bottom = {
		r: c01.r + (c11.r - c01.r) * fx,
		g: c01.g + (c11.g - c01.g) * fx,
		b: c01.b + (c11.b - c01.b) * fx,
	};
	return {
		r: top.r + (bottom.r - top.r) * fy,
		g: top.g + (bottom.g - top.g) * fy,
		b: top.b + (bottom.b - top.b) * fy,
	};
}

/**
 * Samples the environment along `dir`, blending between mip levels by
 * `roughness` (0 = sharpest/level 0, 1 = blurriest/last level) as a cheap
 * stand-in for real prefiltered specular convolution.
 */
export function sampleEnvironment(
	env: EnvironmentMap,
	dir: Vec3,
	roughness: number
): RgbLinear {
	const { u, v } = directionToEquirectUv(dir);
	const maxLod = env.levels.length - 1;
	const lod = Math.min(1, Math.max(0, roughness)) * maxLod;
	const lodLow = Math.floor(lod);
	const lodHigh = Math.min(maxLod, lodLow + 1);
	const t = lod - lodLow;

	const low = sampleBilinear(env.levels[lodLow], u, v);
	const high = sampleBilinear(env.levels[lodHigh], u, v);
	return {
		r: low.r + (high.r - low.r) * t,
		g: low.g + (high.g - low.g) * t,
		b: low.b + (high.b - low.b) * t,
	};
}
