import { linearToRgbBytes } from "../../../src/shared/materialRamp/colorSpace";
import { posterize } from "../../../src/shared/materialRamp/posterize";
import { RgbLinear } from "../../../src/shared/materialRamp/types";

function gradient(count: number): RgbLinear[] {
	const population: RgbLinear[] = [];
	for (let i = 0; i < count; i++) {
		const t = i / (count - 1);
		population.push({ r: 0.05 + 0.9 * t, g: 0.05 + 0.7 * t, b: 0.05 + 0.5 * t });
	}
	return population;
}

function colorKey(color: { r: number; g: number; b: number }): string {
	return `${color.r},${color.g},${color.b}`;
}

describe("posterize", () => {
	it("throws on an empty population", () => {
		expect(() => posterize([], 4)).toThrow();
	});

	it("is deterministic across repeated calls with identical input", () => {
		const population = gradient(200);
		const a = posterize(population, 7);
		const b = posterize(population, 7);
		expect(a).toEqual(b);
	});

	it("clamps stopCount below 2 up to 2", () => {
		const stops = posterize(gradient(50), 0);
		expect(stops).toHaveLength(2);
	});

	it("clamps stopCount above the population size down to the population size", () => {
		const population = gradient(5);
		const stops = posterize(population, 1000);
		expect(stops.length).toBeLessThanOrEqual(5);
	});

	it("every stop is a literal population member, never a blended/synthetic color", () => {
		const population = gradient(150);
		const stops = posterize(population, 12);
		const populationKeys = new Set(
			population.map((p) => colorKey(linearToRgbBytes(p)))
		);
		for (const stop of stops) {
			expect(populationKeys.has(colorKey(stop.color))).toBe(true);
		}
	});

	it("never places two stops with the identical rounded color", () => {
		// A population with far less genuine color variety than requested
		// stops: everything is one of only 3 exact colors. Padding out to 12
		// would necessarily duplicate one of them.
		const population: RgbLinear[] = [
			...Array(80).fill({ r: 0.1, g: 0.1, b: 0.1 }),
			...Array(80).fill({ r: 0.5, g: 0.3, b: 0.2 }),
			...Array(80).fill({ r: 0.9, g: 0.9, b: 0.9 }),
		];
		const stops = posterize(population, 12);
		const keys = stops.map((s) => colorKey(s.color));
		expect(new Set(keys).size).toBe(keys.length);
		expect(stops).toHaveLength(3);
	});

	it("isolates a small, distinctly-colored minority cluster alongside a continuous majority gradient", () => {
		// Mirrors a specular highlight on a metal sphere: most of the
		// population is a smooth gradient, but a small (~3%) cluster is a
		// distinctly bright, different color -- it should still get its own
		// stop rather than being averaged away or ignored by the majority.
		const population = [
			...gradient(1750),
			...Array(50).fill({ r: 0.95, g: 0.95, b: 0.95 }),
		];
		const stops = posterize(population, 16);
		const hasOutlier = stops.some(
			(s) => s.color.r >= 240 && s.color.g >= 240 && s.color.b >= 240
		);
		expect(hasOutlier).toBe(true);
	});

	it("always includes mandatoryIndex's exact color", () => {
		const population = gradient(200);
		const mandatoryIndex = 137;
		for (const stopCount of [3, 5, 10]) {
			const stops = posterize(population, stopCount, mandatoryIndex);
			const expectedKey = colorKey(linearToRgbBytes(population[mandatoryIndex]));
			expect(stops.map((s) => colorKey(s.color))).toContain(expectedKey);
		}
	});

	it("keeps mandatoryIndex's exact color even in a population with no other variation", () => {
		// A perfectly uniform population has zero spread, so nothing would
		// normally get split out on its own -- mandatoryIndex must still force
		// its bucket to report it (trivially true here since it's the only
		// value anyway, but confirms the override path doesn't error/skip it).
		const population: RgbLinear[] = Array(50).fill({ r: 0.5, g: 0.5, b: 0.5 });
		const stops = posterize(population, 3, 10);
		expect(stops.map((s) => colorKey(s.color))).toContain(
			colorKey(linearToRgbBytes(population[10]))
		);
	});

	it("uses close to the full requested stopCount when the population has enough genuine variety", () => {
		const stops = posterize(gradient(500), 16);
		expect(stops.length).toBeGreaterThanOrEqual(12);
	});
});
