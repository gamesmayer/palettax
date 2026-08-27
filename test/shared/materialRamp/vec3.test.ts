import {
	cross3,
	dot3,
	normalize3,
} from "../../../src/shared/materialRamp/vec3";

describe("dot3", () => {
	it("is 0 for orthogonal vectors", () => {
		expect(dot3([1, 0, 0], [0, 1, 0])).toBe(0);
	});

	it("is the product of magnitudes for parallel vectors", () => {
		expect(dot3([2, 0, 0], [3, 0, 0])).toBe(6);
	});

	it("computes the general dot product", () => {
		expect(dot3([1, 2, 3], [4, 5, 6])).toBe(1 * 4 + 2 * 5 + 3 * 6);
	});
});

describe("normalize3", () => {
	it("returns a unit vector for a non-zero input", () => {
		const n = normalize3([3, 4, 0]);
		expect(Math.sqrt(dot3(n, n))).toBeCloseTo(1, 10);
	});

	it("preserves direction", () => {
		const n = normalize3([0, 5, 0]);
		expect(n[0]).toBeCloseTo(0, 10);
		expect(n[1]).toBeCloseTo(1, 10);
		expect(n[2]).toBeCloseTo(0, 10);
	});

	// Deliberate guard in normalize3 (`|| 1` on the length): without it,
	// dividing a zero vector by its own (zero) length would produce NaN.
	it("returns the zero vector for a zero-length input instead of NaN", () => {
		expect(normalize3([0, 0, 0])).toEqual([0, 0, 0]);
	});
});

describe("cross3", () => {
	it("satisfies i x j = k for the standard basis", () => {
		expect(cross3([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
	});

	it("satisfies j x k = i for the standard basis", () => {
		expect(cross3([0, 1, 0], [0, 0, 1])).toEqual([1, 0, 0]);
	});

	it("is anti-commutative: a x b = -(b x a)", () => {
		const a: [number, number, number] = [1, 2, 3];
		const b: [number, number, number] = [4, 5, 6];
		const ab = cross3(a, b);
		const ba = cross3(b, a);
		expect(ab).toEqual([-ba[0], -ba[1], -ba[2]]);
	});

	it("is the zero vector for a vector crossed with itself", () => {
		expect(cross3([1, 2, 3], [1, 2, 3])).toEqual([0, 0, 0]);
	});
});
