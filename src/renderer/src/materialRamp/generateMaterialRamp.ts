import { evaluateBaseColor } from "../../../shared/materialRamp/brdf";
import { DEFAULT_LIGHTING } from "../../../shared/materialRamp/lightingConstants";
import { posterize } from "../../../shared/materialRamp/posterize";
import { renderMaterialSphere } from "../../../shared/materialRamp/sphereRender";
import {
	LightingConfig,
	MaterialDefinition,
	MaterialRampStop,
	RgbLinear,
} from "../../../shared/materialRamp/types";

// Resolution of the sphere sampled to build the color population stops are
// quantized from -- independent of (and coarser than) the preview panes' own
// render sizes (see MaterialRampPreview.tsx). Measured empirically against a
// polished-metal material (near-mirror, sharp environment reflections): at
// 32/48 this undersamples the reflection near the sphere's silhouette edge
// badly enough to actually score WORSE (higher max quantization error against
// a dense reference render) than the retired 1-D-arc algorithm it replaced;
// 64 is the smallest size that consistently beats it on both mean and max
// error. Still far cheaper than the continuous preview's own 128x128 CPU
// render that already runs on every material/lighting change.
const STOP_SAMPLE_SPHERE_SIZE = 64;

export interface MaterialRampResult {
	stops: MaterialRampStop[];
}

/**
 * Orchestrates the full pipeline: render the material over the actual
 * visible hemisphere (reusing renderMaterialSphere -- the same function the
 * sphere preview itself renders with, see sphereRender.ts) to build a real
 * color population, guarantee the exact solved Base color
 * (evaluateBaseColor -- the same function solveAlbedo.ts solves the albedo
 * against) is present in it, then median-cut quantize that population into
 * `stopCount` ramp stops (see posterize.ts). Sampling the real hemisphere
 * rather than a single light/view-plane arc is what keeps the generated
 * stops representative of what the sphere preview actually shows --
 * particularly important for reflective materials, whose appearance varies
 * with the full 3-D surface normal, not just how directly it faces the
 * light (see sphereRender.ts's nearestStopColors doc comment). Deterministic
 * for identical inputs (spec point 13).
 */
export function generateMaterialRamp(
	material: MaterialDefinition,
	stopCount: number,
	lighting: LightingConfig = DEFAULT_LIGHTING
): MaterialRampResult {
	const cells = renderMaterialSphere(
		material,
		lighting,
		STOP_SAMPLE_SPHERE_SIZE
	);
	const population: RgbLinear[] = cells
		.filter((cell): cell is { rgbLinear: RgbLinear } => cell !== null)
		.map((cell) => cell.rgbLinear);

	const mandatoryIndex = population.length;
	population.push(evaluateBaseColor(material, lighting));

	return { stops: posterize(population, stopCount, mandatoryIndex) };
}
