import {
	evaluateBaseColor,
	evaluateMaterial,
} from "../../../shared/materialRamp/brdf";
import {
	baseT,
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
 * Patches the single dense sample nearest to the exact Base sweep position
 * (baseT, i.e. N=viewDir) in place, overwriting it with evaluateBaseColor's
 * literal output -- the same function solveAlbedo.ts solves the albedo
 * against. Neither the GPU strip render nor the CPU sweep's regular t-grid
 * lands on that position exactly (see baseT's comment in
 * orientationSweep.ts), so without this, no ramp stop could ever be
 * guaranteed to exactly match the material's solved Base color -- the
 * "Base" stop shown in MaterialRampPreview.tsx/rampNaming.ts would only ever
 * be the *nearest available* one, with an unbounded perceptual gap.
 * Overwriting in place (rather than inserting a new sample) keeps
 * `dense.length` at exactly `sampleWidth` and preserves ascending `t` order,
 * since the patched t is by definition within the gap between its immediate
 * neighbors.
 */
function withExactBaseSample(
	dense: DenseSample[],
	material: MaterialDefinition,
	lighting: LightingConfig
): { dense: DenseSample[]; baseIndex: number } {
	const t = baseT(computeSweepBasis(lighting));
	let baseIndex = 0;
	let bestDistance = Infinity;
	for (let i = 0; i < dense.length; i++) {
		const distance = Math.abs(dense[i].t - t);
		if (distance < bestDistance) {
			bestDistance = distance;
			baseIndex = i;
		}
	}
	const patched = [...dense];
	patched[baseIndex] = { t, rgbLinear: evaluateBaseColor(material, lighting) };
	return { dense: patched, baseIndex };
}

/**
 * Orchestrates the full pipeline: render the dense material-response strip
 * (GPU, falling back to the CPU reference implementation if WebGL2 isn't
 * available at all), guarantee the exact Base sample is present (see
 * withExactBaseSample), then adaptively posterize it into `stopCount` ramp
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

	const rawDense: DenseSample[] = gpuResult
		? Array.from({ length: sampleWidth }, (_, i) => ({
				t: i / (sampleWidth - 1),
				rgbLinear: {
					r: gpuResult.samples[i * 4],
					g: gpuResult.samples[i * 4 + 1],
					b: gpuResult.samples[i * 4 + 2],
				},
			}))
		: denseFromCpu(material, lighting, sampleWidth);

	const { dense, baseIndex } = withExactBaseSample(
		rawDense,
		material,
		lighting
	);

	return { stops: posterize(dense, stopCount, baseIndex), dense };
}
