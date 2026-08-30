import {
	linearToRgbBytes,
	OklabColor,
	oklabDeltaE,
	rgbLinearToOklab,
} from "./colorSpace";
import { MaterialRampStop, RgbLinear } from "./types";

interface Bucket {
	indices: number[];
}

type Axis = "L" | "a" | "b";
const AXES: Axis[] = ["L", "a", "b"];

function rangeAlong(bucket: Bucket, oklab: OklabColor[], axis: Axis): number {
	let min = Infinity;
	let max = -Infinity;
	for (const i of bucket.indices) {
		const v = oklab[i][axis];
		if (v < min) min = v;
		if (v > max) max = v;
	}
	return max - min;
}

function widestAxis(
	bucket: Bucket,
	oklab: OklabColor[]
): { axis: Axis; range: number } {
	let axis: Axis = "L";
	let range = -Infinity;
	for (const candidate of AXES) {
		const candidateRange = rangeAlong(bucket, oklab, candidate);
		if (candidateRange > range) {
			range = candidateRange;
			axis = candidate;
		}
	}
	return { axis, range };
}

function splitBucket(
	bucket: Bucket,
	oklab: OklabColor[],
	axis: Axis
): [Bucket, Bucket] {
	const sorted = [...bucket.indices].sort((i, j) => {
		const diff = oklab[i][axis] - oklab[j][axis];
		return diff !== 0 ? diff : i - j;
	});
	const mid = Math.floor(sorted.length / 2);
	return [{ indices: sorted.slice(0, mid) }, { indices: sorted.slice(mid) }];
}

// The bucket's actual medoid member (nearest to its own OKLab mean) --
// deliberately not the mean itself, so a stop is always a literal,
// physically achievable BRDF output rather than a blended/synthetic color.
function medoidOf(bucket: Bucket, oklab: OklabColor[]): number {
	const n = bucket.indices.length;
	let sumL = 0;
	let sumA = 0;
	let sumB = 0;
	for (const i of bucket.indices) {
		sumL += oklab[i].L;
		sumA += oklab[i].a;
		sumB += oklab[i].b;
	}
	const mean: OklabColor = { L: sumL / n, a: sumA / n, b: sumB / n };

	let best = bucket.indices[0];
	let bestDistance = Infinity;
	for (const i of bucket.indices) {
		const distance = oklabDeltaE(oklab[i], mean);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = i;
		}
	}
	return best;
}

function colorKey(rgb: RgbLinear): string {
	const bytes = linearToRgbBytes(rgb);
	return `${bytes.r},${bytes.g},${bytes.b}`;
}

/**
 * Reduces a color population (e.g. every visible pixel of a rendered
 * material sphere -- see generateMaterialRamp.ts) to `stopCount`
 * representative stops via median-cut quantization in OKLab space:
 * starting from one bucket containing the whole population, repeatedly
 * splits whichever splittable bucket has the widest spread along any single
 * OKLab axis, dividing it at the median along that axis, until there are
 * `stopCount` buckets or none are splittable left (every remaining bucket
 * is a singleton or has zero spread -- the population genuinely doesn't
 * have that many distinguishable colors). Deterministic -- no randomness,
 * ties broken by a fixed ordering (range desc, then bucket size desc, then
 * lowest member index asc).
 *
 * Each bucket's reported color is its medoid (the actual population member
 * closest to the bucket's OKLab mean), never a blended average -- every
 * stop is always a literal, physically achievable material response.
 *
 * `mandatoryIndex`, if given, is always reported exactly by whichever
 * bucket ends up containing it (used by generateMaterialRamp.ts to
 * guarantee the material's exact solved Base color is always one of the
 * stops), overriding that bucket's own computed medoid.
 *
 * Never returns two stops with the identical rounded sRGB byte color: if
 * two buckets' representative colors round to the same byte value, the
 * later one is dropped rather than padding the result with a duplicate --
 * so the result can have fewer than `stopCount` stops when the population
 * doesn't support that many visually distinct colors.
 */
export function posterize(
	population: RgbLinear[],
	stopCount: number,
	mandatoryIndex?: number
): MaterialRampStop[] {
	if (population.length === 0) {
		throw new Error("posterize requires at least 1 population sample");
	}
	const targetCount = Math.max(2, Math.min(stopCount, population.length));
	const oklab = population.map(rgbLinearToOklab);

	let buckets: Bucket[] = [{ indices: population.map((_, i) => i) }];

	while (buckets.length < targetCount) {
		const candidates = buckets
			.map((bucket, index) => {
				if (bucket.indices.length < 2) return null;
				const { axis, range } = widestAxis(bucket, oklab);
				if (range <= 0) return null; // every member is the same color
				return {
					index,
					axis,
					range,
					size: bucket.indices.length,
					minIndex: Math.min(...bucket.indices),
				};
			})
			.filter((c): c is NonNullable<typeof c> => c !== null);

		if (candidates.length === 0) break; // nothing left splittable

		candidates.sort((a, b) => {
			if (b.range !== a.range) return b.range - a.range;
			if (b.size !== a.size) return b.size - a.size;
			return a.minIndex - b.minIndex;
		});

		const chosen = candidates[0];
		const [left, right] = splitBucket(
			buckets[chosen.index],
			oklab,
			chosen.axis
		);
		buckets = [
			...buckets.slice(0, chosen.index),
			left,
			right,
			...buckets.slice(chosen.index + 1),
		];
	}

	const representatives = buckets.map((bucket) => medoidOf(bucket, oklab));
	if (mandatoryIndex !== undefined) {
		const ownerBucket = buckets.findIndex((bucket) =>
			bucket.indices.includes(mandatoryIndex)
		);
		if (ownerBucket !== -1) {
			representatives[ownerBucket] = mandatoryIndex;
		}
	}

	const seenColors = new Set<string>();
	const stops: MaterialRampStop[] = [];
	for (const index of representatives) {
		const key = colorKey(population[index]);
		if (seenColors.has(key)) continue;
		seenColors.add(key);
		stops.push({ color: linearToRgbBytes(population[index]) });
	}
	return stops;
}
