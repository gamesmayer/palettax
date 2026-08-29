import { evaluateMaterial } from "../../../shared/materialRamp/brdf";
import {
	computeSweepBasis,
	normalAtT,
} from "../../../shared/materialRamp/orientationSweep";
import { DEFAULT_LIGHTING } from "../../../shared/materialRamp/lightingConstants";
import { DenseSample, posterize } from "../../../shared/materialRamp/posterize";
import {
	LightingConfig,
	MaterialDefinition,
	MaterialRampStop,
} from "../../../shared/materialRamp/types";
import { materialStripRenderer } from "./webglStripRenderer";

const DEFAULT_SAMPLE_WIDTH = 512;

function denseFromCpu(
	material: MaterialDefinition,
	lighting: LightingConfig,
	width: number
): DenseSample[] {
	const basis = computeSweepBasis(lighting);
	const dense: DenseSample[] = [];
	for (let i = 0; i < width; i++) {
		const t = i / (width - 1);
		dense.push({
			t,
			rgbLinear: evaluateMaterial(material, lighting, normalAtT(t, basis)),
		});
	}
	return dense;
}

export interface MaterialRampResult {
	stops: MaterialRampStop[];
	dense: DenseSample[];
}

/**
 * Orchestrates the full pipeline: render the dense material-response strip
 * (GPU, falling back to the CPU reference implementation if WebGL2 isn't
 * available at all), then adaptively posterize it into `stopCount` ramp
 * stops. Deterministic for identical inputs (spec point 13).
 */
export function generateMaterialRamp(
	material: MaterialDefinition,
	stopCount: number,
	lighting: LightingConfig = DEFAULT_LIGHTING,
	sampleWidth: number = DEFAULT_SAMPLE_WIDTH
): MaterialRampResult {
	const gpuResult = materialStripRenderer.render(
		material,
		lighting,
		sampleWidth
	);

	const dense: DenseSample[] = gpuResult
		? Array.from({ length: sampleWidth }, (_, i) => ({
				t: i / (sampleWidth - 1),
				rgbLinear: {
					r: gpuResult.samples[i * 4],
					g: gpuResult.samples[i * 4 + 1],
					b: gpuResult.samples[i * 4 + 2],
				},
			}))
		: denseFromCpu(material, lighting, sampleWidth);

	return { stops: posterize(dense, stopCount), dense };
}
