import {
	lerpOklab,
	linear01ToSrgbByte,
	linearToRgbBytes,
	nearestOklabIndex,
	oklabDeltaE,
	reinhardTonemap,
	rgbBytesToLinear,
	rgbLinearToOklab,
	srgbByteToLinear01,
} from "../../../src/shared/materialRamp/colorSpace";

describe("srgbByteToLinear01 / linear01ToSrgbByte", () => {
	it("round-trips 0", () => {
		expect(linear01ToSrgbByte(srgbByteToLinear01(0))).toBe(0);
	});

	it("round-trips 255", () => {
		expect(linear01ToSrgbByte(srgbByteToLinear01(255))).toBe(255);
	});

	it("round-trips mid-gray within 1 byte", () => {
		const result = linear01ToSrgbByte(srgbByteToLinear01(128));
		expect(Math.abs(result - 128)).toBeLessThanOrEqual(1);
	});

	it("maps 0 linear to 0 byte and clamps below", () => {
		expect(linear01ToSrgbByte(-1)).toBe(0);
	});

	it("maps 1 linear to 255 byte and clamps above", () => {
		expect(linear01ToSrgbByte(2)).toBe(255);
	});
});

describe("rgbBytesToLinear / linearToRgbBytes", () => {
	it("round-trips black", () => {
		expect(linearToRgbBytes(rgbBytesToLinear({ r: 0, g: 0, b: 0 }))).toEqual({
			r: 0,
			g: 0,
			b: 0,
		});
	});

	it("round-trips white", () => {
		expect(
			linearToRgbBytes(rgbBytesToLinear({ r: 255, g: 255, b: 255 }))
		).toEqual({ r: 255, g: 255, b: 255 });
	});
});

describe("rgbLinearToOklab", () => {
	it("maps linear black to L=0", () => {
		const lab = rgbLinearToOklab({ r: 0, g: 0, b: 0 });
		expect(lab.L).toBeCloseTo(0, 5);
	});

	it("maps linear white to L close to 1", () => {
		const lab = rgbLinearToOklab({ r: 1, g: 1, b: 1 });
		expect(lab.L).toBeCloseTo(1, 2);
	});
});

describe("lerpOklab", () => {
	it("returns the start color at t=0", () => {
		const a = { L: 0.2, a: 0.1, b: -0.1 };
		const b = { L: 0.8, a: -0.1, b: 0.1 };
		expect(lerpOklab(a, b, 0)).toEqual(a);
	});

	it("returns the end color at t=1", () => {
		const a = { L: 0.2, a: 0.1, b: -0.1 };
		const b = { L: 0.8, a: -0.1, b: 0.1 };
		expect(lerpOklab(a, b, 1)).toEqual(b);
	});
});

describe("oklabDeltaE", () => {
	it("is zero for identical colors", () => {
		const c = { L: 0.5, a: 0.02, b: -0.03 };
		expect(oklabDeltaE(c, c)).toBe(0);
	});

	it("is symmetric", () => {
		const a = { L: 0.2, a: 0.1, b: -0.1 };
		const b = { L: 0.8, a: -0.1, b: 0.1 };
		expect(oklabDeltaE(a, b)).toBeCloseTo(oklabDeltaE(b, a), 10);
	});

	it("is positive for distinct colors", () => {
		const a = { L: 0.2, a: 0.1, b: -0.1 };
		const b = { L: 0.8, a: -0.1, b: 0.1 };
		expect(oklabDeltaE(a, b)).toBeGreaterThan(0);
	});
});

describe("nearestOklabIndex", () => {
	const candidates = [
		{ L: 0, a: 0, b: 0 },
		{ L: 0.5, a: 0.02, b: -0.03 },
		{ L: 1, a: 0, b: 0 },
	];

	it("picks the index of the exact match", () => {
		expect(nearestOklabIndex(candidates[1], candidates)).toBe(1);
	});

	it("picks the closest candidate for an in-between target", () => {
		const target = { L: 0.85, a: 0, b: 0 }; // closer to candidates[2] (L=1)
		expect(nearestOklabIndex(target, candidates)).toBe(2);
	});
});

describe("reinhardTonemap", () => {
	it("maps 0 to 0", () => {
		expect(reinhardTonemap({ r: 0, g: 0, b: 0 })).toEqual({
			r: 0,
			g: 0,
			b: 0,
		});
	});

	it("approaches 1 for large input", () => {
		const result = reinhardTonemap({ r: 1000, g: 1000, b: 1000 });
		expect(result.r).toBeGreaterThan(0.99);
		expect(result.r).toBeLessThan(1);
	});

	it("is monotonically non-decreasing per channel", () => {
		const low = reinhardTonemap({ r: 0.1, g: 0.1, b: 0.1 });
		const high = reinhardTonemap({ r: 1.0, g: 1.0, b: 1.0 });
		expect(high.r).toBeGreaterThan(low.r);
	});
});
