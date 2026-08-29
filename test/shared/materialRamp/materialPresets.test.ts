import { MATERIAL_PRESETS } from "../../../src/shared/materialRamp/materialPresets";
import { resources } from "../../../src/shared/i18n/resources";

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

	it("has a unique id per preset", () => {
		const ids = MATERIAL_PRESETS.map((preset) => preset.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("has a translated name and examples string for every preset id, in every supported language", () => {
		for (const language of Object.keys(resources) as (keyof typeof resources)[]) {
			for (const preset of MATERIAL_PRESETS) {
				const entry = resources[language].app.materialPresets[
					preset.id as keyof (typeof resources)[typeof language]["app"]["materialPresets"]
				] as { name: string; examples: string } | undefined;
				expect(entry?.name.length).toBeGreaterThan(0);
				expect(entry?.examples.length).toBeGreaterThan(0);
			}
		}
	});
});
