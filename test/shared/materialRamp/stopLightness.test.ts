import { lightnessOf } from "../../../src/shared/materialRamp/stopLightness";
import { MaterialRampStop } from "../../../src/shared/materialRamp/types";

function stopAt(r: number, g: number, b: number): MaterialRampStop {
	return { position: 0, color: { r, g, b } };
}

describe("lightnessOf", () => {
	it("is ~0 for a black stop", () => {
		expect(lightnessOf(stopAt(0, 0, 0))).toBeCloseTo(0, 5);
	});

	it("is ~1 for a white stop", () => {
		expect(lightnessOf(stopAt(255, 255, 255))).toBeCloseTo(1, 2);
	});

	it("increases monotonically across a mid-gray ramp", () => {
		const grays = [0, 32, 64, 96, 128, 160, 192, 224, 255].map((v) =>
			stopAt(v, v, v)
		);
		const lightnesses = grays.map(lightnessOf);
		for (let i = 1; i < lightnesses.length; i++) {
			expect(lightnesses[i]).toBeGreaterThan(lightnesses[i - 1]);
		}
	});
});
