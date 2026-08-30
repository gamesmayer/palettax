import { evaluateBaseColor, evaluateMaterial } from "../../../src/shared/materialRamp/brdf";
import {
	nearestOklabIndex,
	OklabColor,
	rgbBytesToLinear,
	rgbLinearToOklab,
} from "../../../src/shared/materialRamp/colorSpace";
import { decodeEnvironmentImage } from "../../../src/shared/materialRamp/environmentMap";
import { DEFAULT_LIGHTING } from "../../../src/shared/materialRamp/lightingConstants";
import {
	computeSweepBasis,
	normalAtT,
} from "../../../src/shared/materialRamp/orientationSweep";
import { posterize } from "../../../src/shared/materialRamp/posterize";
import { solveAlbedoForTarget } from "../../../src/shared/materialRamp/solveAlbedo";
import { renderMaterialSphere } from "../../../src/shared/materialRamp/sphereRender";
import { RgbLinear } from "../../../src/shared/materialRamp/types";
import fs from "fs";
import path from "path";

// Regression coverage for the bug this file's sibling change fixes: a
// polished (near-mirror) metal's ramp stops used to come from a single
// light/view-plane arc (orientationSweep.ts's normalAtT), which barely
// overlaps the full hemisphere of normals the sphere preview actually
// renders (sphereRender.ts's renderMaterialSphere) -- so the sphere showed
// reflected colors absent from the stop list, and several stops never
// appeared anywhere on the sphere. generateMaterialRamp.ts now builds its
// color population from the real rendered sphere instead (at
// STOP_SAMPLE_SPHERE_SIZE=64, reproduced here since that constant lives in
// the renderer-side file, which can't be imported directly in this
// DOM-less test environment -- see its own comment for how 64 was picked).
// This test proves the fix objectively: it measures each approach's stops
// against a dense reference render and confirms the new one is a
// meaningfully closer match, without requiring a visual check.

function toColors(cells: ReturnType<typeof renderMaterialSphere>): RgbLinear[] {
	return cells
		.filter((c): c is { rgbLinear: RgbLinear } => c !== null)
		.map((c) => c.rgbLinear);
}

function quantizationError(
	reference: OklabColor[],
	stopsOklab: OklabColor[]
): { max: number; mean: number } {
	let max = 0;
	let sum = 0;
	for (const target of reference) {
		const idx = nearestOklabIndex(target, stopsOklab);
		const nearest = stopsOklab[idx];
		const d = Math.sqrt(
			(target.L - nearest.L) ** 2 +
				(target.a - nearest.a) ** 2 +
				(target.b - nearest.b) ** 2
		);
		max = Math.max(max, d);
		sum += d;
	}
	return { max, mean: sum / reference.length };
}

describe("ramp stops representativeness (polished metal)", () => {
	it("sphere-population stops are a closer match to the true sphere than the retired 1-D-arc stops were", () => {
		const bytes = fs.readFileSync(
			path.join(
				__dirname,
				"../../../src/renderer/src/assets/environment/default-environment.png"
			)
		);
		const env = decodeEnvironmentImage(new Uint8Array(bytes));
		const lighting = { ...DEFAULT_LIGHTING, environmentMap: env };
		const target = { r: 0xc8, g: 0xa0, b: 0x8b }; // DEFAULT_TARGET_BASE_COLOR
		const metallic = 1;
		const roughness = 0.05; // polishedMetal preset
		const { albedo } = solveAlbedoForTarget(target, metallic, roughness, lighting);
		const material = { baseColor: albedo, metallic, roughness };

		const referenceOklab = toColors(
			renderMaterialSphere(material, lighting, 128)
		).map(rgbLinearToOklab);

		// New: population from the actual rendered hemisphere.
		const population = toColors(renderMaterialSphere(material, lighting, 64));
		const mandatoryIndex = population.length;
		population.push(evaluateBaseColor(material, lighting));
		const newStops = posterize(population, 16, mandatoryIndex);
		const newStopsOklab = newStops.map((s) =>
			rgbLinearToOklab(rgbBytesToLinear(s.color))
		);

		// Old: population from the single light/view-plane arc.
		const basis = computeSweepBasis(lighting);
		const oldPopulation: RgbLinear[] = [];
		for (let i = 0; i < 512; i++) {
			oldPopulation.push(
				evaluateMaterial(material, lighting, normalAtT(i / 511, basis))
			);
		}
		const oldStops = posterize(oldPopulation, 16);
		const oldStopsOklab = oldStops.map((s) =>
			rgbLinearToOklab(rgbBytesToLinear(s.color))
		);

		const oldError = quantizationError(referenceOklab, oldStopsOklab);
		const newError = quantizationError(referenceOklab, newStopsOklab);

		expect(newError.max).toBeLessThan(oldError.max);
		expect(newError.mean).toBeLessThan(oldError.mean);
	});
});
