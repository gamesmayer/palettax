import { assignRampNames } from "../../../src/shared/materialRamp/rampNaming";
import { MaterialRampStop } from "../../../src/shared/materialRamp/types";

function stopAt(t: number, r: number, g: number, b: number): MaterialRampStop {
	return { position: t, color: { r, g, b } };
}

function gray(v: number): MaterialRampStop {
	return stopAt(v / 255, v, v, v);
}

describe("assignRampNames", () => {
	it("names a 5-stop ramp with the base color in the middle", () => {
		const stops = [gray(0), gray(64), gray(128), gray(192), gray(255)];
		const named = assignRampNames(stops, { r: 128, g: 128, b: 128 });
		expect(named.map((n) => n.name)).toEqual([
			"Deep Shadow",
			"Shadow",
			"Base",
			"Light",
			"Highlight",
		]);
	});

	it("names a 7-stop ramp with the base color in the middle", () => {
		const stops = [
			gray(0),
			gray(32),
			gray(64),
			gray(128),
			gray(192),
			gray(224),
			gray(255),
		];
		const named = assignRampNames(stops, { r: 128, g: 128, b: 128 });
		expect(named.map((n) => n.name)).toEqual([
			"Deep Shadow",
			"Shadow 2",
			"Shadow 1",
			"Base",
			"Light 1",
			"Light 2",
			"Highlight",
		]);
	});

	it("has no shadow names when the base color is the darkest stop", () => {
		const stops = [gray(0), gray(96), gray(192), gray(255)];
		const named = assignRampNames(stops, { r: 0, g: 0, b: 0 });
		expect(named.map((n) => n.name)).toEqual([
			"Base",
			"Light 1",
			"Light 2",
			"Highlight",
		]);
	});

	it("has no light names when the base color is the lightest stop", () => {
		const stops = [gray(0), gray(64), gray(160), gray(255)];
		const named = assignRampNames(stops, { r: 255, g: 255, b: 255 });
		expect(named.map((n) => n.name)).toEqual([
			"Deep Shadow",
			"Shadow 2",
			"Shadow 1",
			"Base",
		]);
	});

	it("names a minimal 2-stop ramp using the plain tier name, not the extreme name", () => {
		// With only one step on a side, "Deep Shadow"/"Highlight" is reserved
		// for when there's a middle step to distinguish it from (see the
		// 5-stop and 7-stop cases above) -- a lone step just gets "Light".
		const stops = [gray(0), gray(255)];
		const named = assignRampNames(stops, { r: 0, g: 0, b: 0 });
		expect(named.map((n) => n.name)).toEqual(["Base", "Light"]);
	});

	it("names a single-stop ramp as Base", () => {
		const stops = [gray(128)];
		const named = assignRampNames(stops, { r: 128, g: 128, b: 128 });
		expect(named.map((n) => n.name)).toEqual(["Base"]);
	});

	it("re-sorts dark-to-light regardless of input order", () => {
		// A specular peak lands mid-array, out of lightness order -- mirrors
		// posterize()'s actual output, which is sorted by sweep position, not
		// lightness (see stopLightness.ts / posterize.ts).
		const stops = [gray(64), gray(255), gray(0), gray(160)];
		const named = assignRampNames(stops, { r: 64, g: 64, b: 64 });
		expect(named.map((n) => n.stop.color.r)).toEqual([0, 64, 160, 255]);
		expect(named.map((n) => n.name)).toEqual([
			"Shadow",
			"Base",
			"Light",
			"Highlight",
		]);
	});
});
