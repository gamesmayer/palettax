import {
	DenseSample,
	posterize,
} from "../../../src/shared/materialRamp/posterize";

function buildDense(fn: (t: number) => number, width = 101): DenseSample[] {
	const samples: DenseSample[] = [];
	for (let i = 0; i < width; i++) {
		const t = i / (width - 1);
		const v = fn(t);
		samples.push({ t, rgbLinear: { r: v, g: v, b: v } });
	}
	return samples;
}

describe("posterize", () => {
	it("always preserves the t=0 and t=1 endpoints", () => {
		const dense = buildDense((t) => t * t);
		for (const stopCount of [2, 3, 5, 10]) {
			const stops = posterize(dense, stopCount);
			expect(stops[0].position).toBe(0);
			expect(stops[stops.length - 1].position).toBe(1);
		}
	});

	it("is deterministic across repeated calls with identical input", () => {
		const dense = buildDense((t) => Math.sin(t * Math.PI));
		const a = posterize(dense, 7);
		const b = posterize(dense, 7);
		expect(a).toEqual(b);
	});

	it("clamps stopCount below 2 up to 2", () => {
		const dense = buildDense((t) => t);
		const stops = posterize(dense, 0);
		expect(stops).toHaveLength(2);
	});

	it("clamps stopCount above the dense sample width down to the width", () => {
		const dense = buildDense((t) => t, 11);
		const stops = posterize(dense, 1000);
		expect(stops.length).toBeLessThanOrEqual(11);
	});

	it("concentrates stops in a band around a sharp knee, unlike a smooth response", () => {
		// Note: error is measured in OKLab, which is itself a nonlinear function
		// of linear RGB -- so even a plain `t => t` ramp isn't perfectly evenly
		// spaced in OKLab terms (it naturally draws a couple of extra samples
		// toward black, where perceptual lightness changes fastest). That's
		// expected/correct behavior, not a bug, but it means a raw "min gap"
		// comparison against a knee response is confounded by that shared
		// near-black clustering. Counting stops that land specifically in the
		// band around the introduced knee isolates the actual signal.
		//
		// The transition is continuous (not a hard step) over a narrow band --
		// a real BRDF knee is steep but never literally two flat plateaus of a
		// single color either side of a discontinuity. A hard step here would
		// leave only 2 distinct colors in the whole fixture, which posterize's
		// no-duplicate-color guarantee (see posterize.ts) would correctly
		// refuse to pad out to 7 stops.
		const knee = buildDense((t) => {
			if (t < 0.68) return 0.1;
			if (t > 0.72) return 0.9;
			return 0.1 + (0.9 - 0.1) * ((t - 0.68) / (0.72 - 0.68));
		});
		const smooth = buildDense((t) => t);

		const kneeStops = posterize(knee, 7).map((s) => s.position);
		const smoothStops = posterize(smooth, 7).map((s) => s.position);

		const inBand = (p: number): boolean => p >= 0.6 && p <= 0.73;

		expect(kneeStops.filter(inBand).length).toBeGreaterThanOrEqual(3);
		expect(smoothStops.filter(inBand).length).toBe(0);
		// the knee sits at t=0.7 -- expect a stop placed close to it
		expect(Math.min(...kneeStops.map((p) => Math.abs(p - 0.7)))).toBeLessThan(
			0.05
		);
	});

	it("always includes mandatoryIndex as a stop, in addition to the endpoints", () => {
		const dense = buildDense((t) => t * t);
		for (const stopCount of [3, 5, 10]) {
			const stops = posterize(dense, stopCount, 30);
			expect(stops.map((s) => s.position)).toContain(dense[30].t);
			expect(stops[0].position).toBe(0);
			expect(stops[stops.length - 1].position).toBe(1);
		}
	});

	it("keeps mandatoryIndex's exact color even where the adaptive search wouldn't have picked it", () => {
		// A flat response has zero interpolation error everywhere, so the
		// adaptive loop would never choose to split near index 30 on its own --
		// mandatoryIndex must still force it in.
		const dense = buildDense(() => 0.5);
		const stops = posterize(dense, 3, 30);
		expect(stops.map((s) => s.position)).toContain(dense[30].t);
	});

	it("at stopCount=2, keeps mandatoryIndex plus whichever endpoint is perceptually farther from it, dropping the other", () => {
		// mandatoryIndex sits near the dark end (t=0.1 -> value 0.01, close to
		// the t=0 endpoint's value 0) and far from the bright t=1 endpoint
		// (value 1) -- so t=1 should be kept and t=0 dropped.
		const dense = buildDense((t) => t);
		const mandatoryIndex = 10; // t = 0.1
		const stops = posterize(dense, 2, mandatoryIndex);
		const positions = stops.map((s) => s.position);
		expect(positions).toContain(dense[mandatoryIndex].t);
		expect(positions).toContain(1);
		expect(positions).not.toContain(0);
		expect(stops).toHaveLength(2);
	});

	it("mandatoryIndex coinciding with an endpoint doesn't duplicate or change the stop count", () => {
		const dense = buildDense((t) => t);
		const stops = posterize(dense, 2, 0);
		expect(stops).toHaveLength(2);
		expect(stops.map((s) => s.position)).toEqual([0, 1]);
	});

	it("never places two stops with the identical rounded color, even under saturation-style flattening", () => {
		// Mimics a Reinhard-tonemap-saturated highlight: a smoothly rising curve
		// that flattens out to a dead-flat plateau approaching t=1. Requesting
		// more stops than the plateau has room for used to force a stop deep in
		// the flat region that rounded to the exact same byte color as the
		// always-preserved t=1 endpoint.
		const dense = buildDense((t) => (t < 0.8 ? t : 0.8 + (t - 0.8) * 0.001));
		const stops = posterize(dense, 16);
		const keys = stops.map(
			(s) => `${s.color.r},${s.color.g},${s.color.b}`
		);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("breaks ties deterministically via span-desc then lower-start-index-asc", () => {
		// f(t) = 1 - (2t-1)^2 is a symmetric parabola about t=0.5, nonlinear on
		// each half, and mirror-symmetric -- so after the first split (always at
		// t=0.5, the only candidate), the two resulting intervals [0,0.5] and
		// [0.5,1] have identical error and identical span, a genuine tie. The
		// documented tie-break (span desc, then lower start index asc) means the
		// left interval [0,0.5] should be split next, placing a stop at t=0.25
		// before one ever appears at t=0.75.
		const dense = buildDense((t) => 1 - (2 * t - 1) ** 2);
		const stops = posterize(dense, 4).map((s) => s.position);
		expect(stops).toEqual([0, 0.25, 0.5, 1]);
	});
});
