import {
	lerpOklab,
	linearToRgbBytes,
	OklabColor,
	oklabDeltaE,
	rgbLinearToOklab,
} from "./colorSpace";
import { MaterialRampStop, RgbLinear } from "./types";

export interface DenseSample {
	t: number; // illumination position, 0..1
	rgbLinear: RgbLinear;
}

interface Interval {
	loIndex: number;
	hiIndex: number;
}

// OKLab lightness is proportional to the cube root of linear luminance,
// which has an unbounded derivative at exactly zero. Any response that
// starts at true black (as ours always does at intensity=0 -- see
// evaluateMaterial) therefore shows a sharp, near-singular perceptual rise
// in a narrow band just above zero, *regardless of the material* -- a
// straight diffuse ramp and a glossy specular knee both trigger it equally.
// Left unchecked, this artifact's error always dwarfs any real
// material-specific curvature (e.g. an actual specular knee further out),
// so a small requested stop count gets entirely consumed reproducing it,
// and every material ends up with the same near-black-clustered ramp. This
// floor caps how far that cube-root steepness is allowed to dominate the
// split decision -- it does not touch the final stop colors, only which
// intervals are judged to need more resolution. 0.02 (linear RGB, roughly
// an 8-bit-sRGB value in the high 30s) sits comfortably below the visible
// mid-tone range while safely above the near-zero singularity band, which
// is more than sufficient for a low-resolution hand-painted texture ramp.
const PERCEPTUAL_FLOOR = 0.02;

function floorForError(rgb: RgbLinear): RgbLinear {
	return {
		r: Math.max(rgb.r, PERCEPTUAL_FLOOR),
		g: Math.max(rgb.g, PERCEPTUAL_FLOOR),
		b: Math.max(rgb.b, PERCEPTUAL_FLOOR),
	};
}

function midIndexOf(iv: Interval): number {
	return iv.loIndex + Math.round((iv.hiIndex - iv.loIndex) / 2);
}

function scoreInterval(
	iv: Interval,
	dense: DenseSample[],
	oklab: OklabColor[]
): { midIndex: number; error: number } | null {
	const midIndex = midIndexOf(iv);
	if (midIndex === iv.loIndex || midIndex === iv.hiIndex) {
		return null; // adjacent samples -- not splittable further
	}
	const loT = dense[iv.loIndex].t;
	const hiT = dense[iv.hiIndex].t;
	const frac = hiT === loT ? 0.5 : (dense[midIndex].t - loT) / (hiT - loT);
	const interpolated = lerpOklab(oklab[iv.loIndex], oklab[iv.hiIndex], frac);
	const error = oklabDeltaE(interpolated, oklab[midIndex]);
	return { midIndex, error };
}

/**
 * Recursive error-driven adaptive posterization: starting from the two
 * endpoints (always preserved), repeatedly splits whichever interval has the
 * largest OKLab perceptual error between its linear interpolation and the
 * true dense-sampled midpoint, until `stopCount` stops have been placed.
 * Deterministic -- no randomness, and ties are broken by a fixed, total
 * ordering (error desc, then span desc, then lower start index asc).
 */
export function posterize(
	dense: DenseSample[],
	stopCount: number
): MaterialRampStop[] {
	if (dense.length < 2) {
		throw new Error("posterize requires at least 2 dense samples");
	}
	const width = dense.length;
	const targetCount = Math.max(2, Math.min(stopCount, width));
	const oklab = dense.map((s) => rgbLinearToOklab(floorForError(s.rgbLinear)));

	let intervals: Interval[] = [{ loIndex: 0, hiIndex: width - 1 }];
	const stopIndices = new Set<number>([0, width - 1]);

	while (stopIndices.size < targetCount) {
		const candidates = intervals
			.map((iv) => {
				const scored = scoreInterval(iv, dense, oklab);
				return scored ? { iv, ...scored } : null;
			})
			.filter(
				(c): c is { iv: Interval; midIndex: number; error: number } =>
					c !== null
			);

		if (candidates.length === 0) break; // dense array exhausted

		candidates.sort((a, b) => {
			if (b.error !== a.error) return b.error - a.error;
			const spanA = a.iv.hiIndex - a.iv.loIndex;
			const spanB = b.iv.hiIndex - b.iv.loIndex;
			if (spanB !== spanA) return spanB - spanA;
			return a.iv.loIndex - b.iv.loIndex;
		});

		const chosen = candidates[0];
		stopIndices.add(chosen.midIndex);
		intervals = intervals.filter((iv) => iv !== chosen.iv);
		intervals.push({ loIndex: chosen.iv.loIndex, hiIndex: chosen.midIndex });
		intervals.push({ loIndex: chosen.midIndex, hiIndex: chosen.iv.hiIndex });
	}

	return [...stopIndices]
		.sort((a, b) => a - b)
		.map((i) => ({
			position: dense[i].t,
			color: linearToRgbBytes(dense[i].rgbLinear),
		}));
}
