import {
	BASE_COLOR_LIGHTNESS_WARN_HIGH,
	BASE_COLOR_LIGHTNESS_WARN_LOW,
	MAX_STOPS,
	MIN_STOPS,
} from "../../../src/shared/materialRamp/dialogConstants";
import {
	clampIntensity,
	clampStopCount,
	clampUnit,
	warningForBaseColor,
} from "../../../src/shared/materialRamp/dialogValidation";

describe("clampUnit", () => {
	it("clamps values below 0 up to 0", () => {
		expect(clampUnit(-0.5)).toBe(0);
	});

	it("clamps values above 1 down to 1", () => {
		expect(clampUnit(1.5)).toBe(1);
	});

	it("passes through values already within [0, 1]", () => {
		expect(clampUnit(0.42)).toBe(0.42);
	});
});

describe("clampIntensity", () => {
	it("clamps negative values up to 0", () => {
		expect(clampIntensity(-3)).toBe(0);
	});

	it("allows values above 1, unlike clampUnit", () => {
		expect(clampIntensity(5)).toBe(5);
	});

	it("passes through 0", () => {
		expect(clampIntensity(0)).toBe(0);
	});
});

describe("clampStopCount", () => {
	it("clamps below MIN_STOPS up to MIN_STOPS", () => {
		expect(clampStopCount(0)).toBe(MIN_STOPS);
	});

	it("clamps above MAX_STOPS down to MAX_STOPS", () => {
		expect(clampStopCount(1000)).toBe(MAX_STOPS);
	});

	it("rounds fractional input to the nearest integer", () => {
		expect(clampStopCount(8.6)).toBe(9);
		expect(clampStopCount(8.4)).toBe(8);
	});
});

describe("warningForBaseColor", () => {
	it("warns when lightness is at or above BASE_COLOR_LIGHTNESS_WARN_HIGH", () => {
		expect(warningForBaseColor({ r: 255, g: 255, b: 255 })).toMatch(
			/close to white/
		);
	});

	it("warns when lightness is at or below BASE_COLOR_LIGHTNESS_WARN_LOW", () => {
		expect(warningForBaseColor({ r: 0, g: 0, b: 0 })).toMatch(
			/close to black/
		);
	});

	it("returns null for a mid-lightness color", () => {
		expect(warningForBaseColor({ r: 128, g: 128, b: 128 })).toBeNull();
	});

	// Sanity-checks the thresholds actually gate the warning, independent of
	// the specific RGB->OKLab conversion (pure black/white above already
	// cover the conversion itself).
	it("thresholds are within (0, 1), leaving a genuine mid-range with no warning", () => {
		expect(BASE_COLOR_LIGHTNESS_WARN_LOW).toBeGreaterThan(0);
		expect(BASE_COLOR_LIGHTNESS_WARN_HIGH).toBeLessThan(1);
		expect(BASE_COLOR_LIGHTNESS_WARN_LOW).toBeLessThan(
			BASE_COLOR_LIGHTNESS_WARN_HIGH
		);
	});
});
