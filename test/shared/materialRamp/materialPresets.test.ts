import { MATERIAL_PRESETS } from "../../../src/shared/materialRamp/materialPresets";

describe("MATERIAL_PRESETS", () => {
	it("is non-empty", () => {
		expect(MATERIAL_PRESETS.length).toBeGreaterThan(0);
	});

	it("keeps metallic within [0, 1] for every preset", () => {
		for (const preset of MATERIAL_PRESETS) {
			expect(preset.metallic).toBeGreaterThanOrEqual(0);
			expect(preset.metallic).toBeLessThanOrEqual(1);
		}
	});

	it("keeps roughness within [0, 1] for every preset", () => {
		for (const preset of MATERIAL_PRESETS) {
			expect(preset.roughness).toBeGreaterThanOrEqual(0);
			expect(preset.roughness).toBeLessThanOrEqual(1);
		}
	});

	it("has a unique name per preset", () => {
		const names = MATERIAL_PRESETS.map((preset) => preset.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("has a non-empty examples string per preset", () => {
		for (const preset of MATERIAL_PRESETS) {
			expect(preset.examples.length).toBeGreaterThan(0);
		}
	});
});
