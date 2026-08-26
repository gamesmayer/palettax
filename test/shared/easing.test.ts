import { applyEasing, Easing } from "../../src/shared/easing";

const EASING_METHODS: Easing[] = [
	"linear",
	"ease-in",
	"ease-out",
	"ease-in-out",
	"smootherstep",
];

describe("applyEasing", () => {
	it.each(EASING_METHODS)("maps t=0 to 0 for %s", (easing) => {
		expect(applyEasing(easing, 0)).toBeCloseTo(0, 10);
	});

	it.each(EASING_METHODS)("maps t=1 to 1 for %s", (easing) => {
		expect(applyEasing(easing, 1)).toBeCloseTo(1, 10);
	});

	describe("linear", () => {
		it("returns t unchanged", () => {
			expect(applyEasing("linear", 0.25)).toBeCloseTo(0.25, 10);
			expect(applyEasing("linear", 0.5)).toBeCloseTo(0.5, 10);
			expect(applyEasing("linear", 0.75)).toBeCloseTo(0.75, 10);
		});
	});

	describe("ease-in", () => {
		it("matches t squared", () => {
			expect(applyEasing("ease-in", 0.25)).toBeCloseTo(0.0625, 10);
			expect(applyEasing("ease-in", 0.5)).toBeCloseTo(0.25, 10);
			expect(applyEasing("ease-in", 0.75)).toBeCloseTo(0.5625, 10);
		});

		it("produces less progress than linear before the end", () => {
			expect(applyEasing("ease-in", 0.25)).toBeLessThan(0.25);
			expect(applyEasing("ease-in", 0.5)).toBeLessThan(0.5);
			expect(applyEasing("ease-in", 0.75)).toBeLessThan(0.75);
		});
	});

	describe("ease-out", () => {
		it("matches 1 - (1-t) squared", () => {
			expect(applyEasing("ease-out", 0.25)).toBeCloseTo(0.4375, 10);
			expect(applyEasing("ease-out", 0.5)).toBeCloseTo(0.75, 10);
			expect(applyEasing("ease-out", 0.75)).toBeCloseTo(0.9375, 10);
		});

		it("produces more progress than linear before the end", () => {
			expect(applyEasing("ease-out", 0.25)).toBeGreaterThan(0.25);
			expect(applyEasing("ease-out", 0.5)).toBeGreaterThan(0.5);
			expect(applyEasing("ease-out", 0.75)).toBeGreaterThan(0.75);
		});
	});

	describe("ease-in-out", () => {
		it("matches the smoothstep formula (3t² - 2t³)", () => {
			expect(applyEasing("ease-in-out", 0.25)).toBeCloseTo(0.15625, 10);
			expect(applyEasing("ease-in-out", 0.5)).toBeCloseTo(0.5, 10);
			expect(applyEasing("ease-in-out", 0.75)).toBeCloseTo(0.84375, 10);
		});

		it("is symmetric around the midpoint, matching linear only there", () => {
			expect(applyEasing("ease-in-out", 0.5)).toBeCloseTo(0.5, 10);
			expect(applyEasing("ease-in-out", 0.25)).toBeLessThan(0.25);
			expect(applyEasing("ease-in-out", 0.75)).toBeGreaterThan(0.75);
		});
	});

	describe("smootherstep", () => {
		it("matches the smootherstep formula (6t⁵ - 15t⁴ + 10t³)", () => {
			expect(applyEasing("smootherstep", 0.25)).toBeCloseTo(0.103515625, 10);
			expect(applyEasing("smootherstep", 0.5)).toBeCloseTo(0.5, 10);
			expect(applyEasing("smootherstep", 0.75)).toBeCloseTo(0.896484375, 10);
		});

		it("is flatter near the extremes than ease-in-out", () => {
			expect(applyEasing("smootherstep", 0.25)).toBeLessThan(
				applyEasing("ease-in-out", 0.25)
			);
			expect(applyEasing("smootherstep", 0.75)).toBeGreaterThan(
				applyEasing("ease-in-out", 0.75)
			);
		});
	});
});
