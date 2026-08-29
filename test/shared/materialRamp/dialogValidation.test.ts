import {
	ALBEDO_LIGHTNESS_WARN_HIGH,
	ALBEDO_LIGHTNESS_WARN_LOW,
	MAX_STOPS,
	MIN_STOPS,
} from "../../../src/shared/materialRamp/dialogConstants";
import {
	clampIntensity,
	clampStopCount,
	clampUnit,
	warningForAlbedoColor,
	warningForUnreachableTarget,
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

describe("warningForAlbedoColor", () => {
	it("warns when lightness is at or above ALBEDO_LIGHTNESS_WARN_HIGH", () => {
		expect(warningForAlbedoColor({ r: 255, g: 255, b: 255 })).toMatch(
			/close to white/
		);
	});

	it("warns when lightness is at or below ALBEDO_LIGHTNESS_WARN_LOW", () => {
		expect(warningForAlbedoColor({ r: 0, g: 0, b: 0 })).toMatch(
			/close to black/
		);
	});

	it("returns null for a mid-lightness color", () => {
		expect(warningForAlbedoColor({ r: 128, g: 128, b: 128 })).toBeNull();
	});

	// Sanity-checks the thresholds actually gate the warning, independent of
	// the specific RGB->OKLab conversion (pure black/white above already
	// cover the conversion itself).
	it("thresholds are within (0, 1), leaving a genuine mid-range with no warning", () => {
		expect(ALBEDO_LIGHTNESS_WARN_LOW).toBeGreaterThan(0);
		expect(ALBEDO_LIGHTNESS_WARN_HIGH).toBeLessThan(1);
		expect(ALBEDO_LIGHTNESS_WARN_LOW).toBeLessThan(ALBEDO_LIGHTNESS_WARN_HIGH);
	});
});

describe("warningForUnreachableTarget", () => {
	it("returns a 'success' severity when achieved matches the target exactly", () => {
		const result = warningForUnreachableTarget(
			{ r: 180, g: 120, b: 90 },
			{ r: 180, g: 120, b: 90 },
			"hex"
		);
		expect(result.severity).toBe("success");
		expect(result.message).toMatch(/achievable exactly/);
	});

	it("returns a 'warning' severity when off by exactly the rounding floor (1 byte)", () => {
		const result = warningForUnreachableTarget(
			{ r: 180, g: 120, b: 90 },
			{ r: 180, g: 121, b: 90 },
			"hex"
		);
		expect(result.severity).toBe("warning");
	});

	it("escalates to 'error' severity when any single channel differs by more than the rounding floor", () => {
		const result = warningForUnreachableTarget(
			{ r: 180, g: 120, b: 90 },
			{ r: 180, g: 120, b: 40 },
			"hex"
		);
		expect(result.severity).toBe("error");
		expect(result.message).toMatch(/isn't achievable/);
	});

	it("returns an 'error' severity when the target is far brighter than what can be achieved", () => {
		const result = warningForUnreachableTarget(
			{ r: 255, g: 255, b: 255 },
			{ r: 140, g: 140, b: 140 },
			"hex"
		);
		expect(result.severity).toBe("error");
	});

	it("includes both the target and achieved colors, formatted in the requested color system, in the message", () => {
		const result = warningForUnreachableTarget(
			{ r: 180, g: 120, b: 90 },
			{ r: 180, g: 120, b: 40 },
			"rgb"
		);
		expect(result.message).toContain("RGB(180, 120, 90)");
		expect(result.message).toContain("RGB(180, 120, 40)");
	});
});
