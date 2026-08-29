import { computeDraggedValue } from "../../src/shared/numberDrag";

describe("computeDraggedValue", () => {
	it("increases the value by whole step multiples for positive deltas", () => {
		expect(computeDraggedValue(5, 12, 1, 4)).toBe(8);
	});

	it("decreases the value by whole step multiples for negative deltas", () => {
		expect(computeDraggedValue(5, -12, 1, 4)).toBe(2);
	});

	it("rounds sub-threshold deltas to zero steps", () => {
		expect(computeDraggedValue(5, 1, 1, 4)).toBe(5);
	});

	it("keeps decimal steps precise with no floating-point noise", () => {
		expect(computeDraggedValue(0.5, 40, 0.01, 4)).toBe(0.6);
	});

	it("snaps to the step's own decimal precision regardless of startValue's precision", () => {
		expect(computeDraggedValue(0.07, 4, 0.01, 4)).toBe(0.08);
	});

	it("treats an integer step (undefined step defaults handled by caller) as whole numbers", () => {
		expect(computeDraggedValue(10, 20, 1, 4)).toBe(15);
	});
});
