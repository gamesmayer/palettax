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
		const knee = buildDense((t) => (t < 0.7 ? 0.1 : 0.9));
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
