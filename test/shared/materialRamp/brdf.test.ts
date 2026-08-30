import { encode } from "fast-png";
import {
	evaluateBaseColor,
	evaluateMaterial,
	ggxDistribution,
	schlickFresnel,
	smithGeometry,
} from "../../../src/shared/materialRamp/brdf";
import { decodeEnvironmentImage } from "../../../src/shared/materialRamp/environmentMap";
import {
	computeSweepBasis,
	normalAtT,
} from "../../../src/shared/materialRamp/orientationSweep";
import { DEFAULT_LIGHTING } from "../../../src/shared/materialRamp/lightingConstants";

describe("ggxDistribution", () => {
	it("peaks at NdotH=1", () => {
		const alpha = 0.1;
		const atPeak = ggxDistribution(1, alpha);
		const offPeak = ggxDistribution(0.9, alpha);
		expect(atPeak).toBeGreaterThan(offPeak);
	});

	it("grows larger for smaller alpha (glossier) at the peak", () => {
		expect(ggxDistribution(1, 0.05)).toBeGreaterThan(ggxDistribution(1, 0.5));
	});
});

describe("smithGeometry", () => {
	it("stays within (0, 1] for physically plausible inputs", () => {
		const g = smithGeometry(0.7, 0.9, 0.3);
		expect(g).toBeGreaterThan(0);
		expect(g).toBeLessThanOrEqual(1);
	});

	it("equals 1 at normal incidence (NdotL=NdotV=1)", () => {
		expect(smithGeometry(1, 1, 0.3)).toBeCloseTo(1, 10);
	});
});

describe("schlickFresnel", () => {
	const f0 = { r: 0.04, g: 0.04, b: 0.04 };

	it("returns f0 at normal incidence (VdotH=1)", () => {
		const f = schlickFresnel(1, f0);
		expect(f.r).toBeCloseTo(f0.r, 10);
	});

	it("approaches white at grazing angles (VdotH=0)", () => {
		const f = schlickFresnel(0, f0);
		expect(f.r).toBeCloseTo(1, 10);
	});
});

describe("evaluateMaterial", () => {
	const materialA = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 0,
		roughness: 0.9,
	};
	const materialB = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 0,
		roughness: 0.15,
	};
	const materialC = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 1,
		roughness: 0.15,
	};
	const materialD = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 1,
		roughness: 0.8,
	};
	const materials = [materialA, materialB, materialC, materialD];

	const basis = computeSweepBasis(DEFAULT_LIGHTING);
	const fixedNormal = normalAtT(0.5, basis);
	const grazingNormal = normalAtT(0, basis); // N·L = 0, the darkest sweep position

	it("is exactly black when lightIntensity=0 AND ambientIntensity=0, for any normal", () => {
		const darkLighting = {
			...DEFAULT_LIGHTING,
			directionalLightIntensity: 0,
			ambientLightIntensity: 0,
		};
		for (const material of materials) {
			const response = evaluateMaterial(material, darkLighting, fixedNormal);
			expect(response).toEqual({ r: 0, g: 0, b: 0 });
		}
	});

	it("is monotonically non-decreasing in lighting.lightIntensity, at a fixed normal", () => {
		for (const material of materials) {
			let prev = evaluateMaterial(
				material,
				{ ...DEFAULT_LIGHTING, directionalLightIntensity: 0 },
				fixedNormal
			);
			for (let i = 1; i <= 20; i++) {
				const lightIntensity = i / 20;
				const curr = evaluateMaterial(
					material,
					{ ...DEFAULT_LIGHTING, directionalLightIntensity: lightIntensity },
					fixedNormal
				);
				expect(curr.r).toBeGreaterThanOrEqual(prev.r - 1e-9);
				expect(curr.g).toBeGreaterThanOrEqual(prev.g - 1e-9);
				expect(curr.b).toBeGreaterThanOrEqual(prev.b - 1e-9);
				prev = curr;
			}
		}
	});

	it("is deterministic across repeated calls", () => {
		const a = evaluateMaterial(materialB, DEFAULT_LIGHTING, fixedNormal);
		const b = evaluateMaterial(materialB, DEFAULT_LIGHTING, fixedNormal);
		expect(a).toEqual(b);
	});

	it("default ambient keeps a non-metal material's response non-black at the darkest sweep position", () => {
		const response = evaluateMaterial(
			materialA,
			DEFAULT_LIGHTING,
			grazingNormal
		);
		expect(Math.max(response.r, response.g, response.b)).toBeGreaterThan(0);
	});

	it("ambient brightens a pure metal's response via its specular Fresnel term", () => {
		const withoutAmbient = evaluateMaterial(
			materialC,
			{ ...DEFAULT_LIGHTING, ambientLightIntensity: 0 },
			grazingNormal
		);
		const withAmbient = evaluateMaterial(
			materialC,
			DEFAULT_LIGHTING,
			grazingNormal
		);
		expect(
			Math.max(withAmbient.r, withAmbient.g, withAmbient.b)
		).toBeGreaterThan(
			Math.max(withoutAmbient.r, withoutAmbient.g, withoutAmbient.b)
		);
	});

	it("increasing ambientIntensity monotonically brightens a non-metal's response at a fixed normal", () => {
		let prevMax = -Infinity;
		for (let i = 0; i <= 10; i++) {
			const ambientIntensity = i / 10;
			const response = evaluateMaterial(
				materialA,
				{ ...DEFAULT_LIGHTING, ambientLightIntensity: ambientIntensity },
				grazingNormal
			);
			const maxChannel = Math.max(response.r, response.g, response.b);
			expect(maxChannel).toBeGreaterThanOrEqual(prevMax - 1e-9);
			prevMax = maxChannel;
		}
	});

	it("glossy materials briefly cross a bright threshold that rough materials never reach", () => {
		// The specular D term peaks sharply at a well-defined interior sweep
		// position for glossy materials, spiking their response briefly well
		// above the gentle diffuse+ambient baseline; rough materials never
		// develop a strong-enough specular peak to cross the same threshold
		// anywhere in the domain. This is the mechanism that gives adaptive
		// posterization something material-dependent to latch onto. Threshold
		// is calibrated against DEFAULT_LIGHTING's current diffuse ceiling
		// (types.ts's DEFAULT_LIGHTING comment): both rough materials here peak
		// around 0.60-0.70 on diffuse+ambient alone, so 0.85 sits above that
		// ceiling while both glossy materials' specular spike still clears it.
		const widthAboveThreshold = (
			material: typeof materialA,
			threshold = 0.85,
			steps = 1000
		): number => {
			let count = 0;
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const response = evaluateMaterial(
					material,
					DEFAULT_LIGHTING,
					normalAtT(t, basis)
				);
				if (Math.max(response.r, response.g, response.b) > threshold) count++;
			}
			return count / steps;
		};

		expect(widthAboveThreshold(materialB)).toBeGreaterThan(0);
		expect(widthAboveThreshold(materialA)).toBe(0);
		expect(widthAboveThreshold(materialC)).toBeGreaterThan(0);
		expect(widthAboveThreshold(materialD)).toBe(0);
	});
});

describe("evaluateMaterial + environmentMap", () => {
	function buildFixtureEnvironment(): ReturnType<typeof decodeEnvironmentImage> {
		// top row red, bottom row blue -- same fixture shape as environmentMap.test.ts
		const width = 4;
		const height = 2;
		const data = new Uint8Array(width * height * 3);
		for (let x = 0; x < width; x++) {
			data[(0 * width + x) * 3] = 255;
			data[(1 * width + x) * 3 + 2] = 255;
		}
		return decodeEnvironmentImage(
			encode({ width, height, data, depth: 8, channels: 3 })
		);
	}

	const metal = { baseColor: { r: 180, g: 120, b: 90 }, metallic: 1, roughness: 0.05 };
	const basis = computeSweepBasis(DEFAULT_LIGHTING);
	const fixedNormal = normalAtT(0.5, basis);

	it("leaves the response unchanged when environmentMap is unset (regression safety)", () => {
		const without = evaluateMaterial(metal, DEFAULT_LIGHTING, fixedNormal);
		const explicitlyNull = evaluateMaterial(
			metal,
			{ ...DEFAULT_LIGHTING, environmentMap: null },
			fixedNormal
		);
		expect(explicitlyNull).toEqual(without);
	});

	it("leaves the response unchanged when environmentIntensity is 0, even with a map set", () => {
		const environmentMap = buildFixtureEnvironment();
		const without = evaluateMaterial(metal, DEFAULT_LIGHTING, fixedNormal);
		const zeroIntensity = evaluateMaterial(
			metal,
			{ ...DEFAULT_LIGHTING, environmentMap, environmentIntensity: 0 },
			fixedNormal
		);
		expect(zeroIntensity).toEqual(without);
	});

	it("a low-roughness metal picks up a distinctly different color depending on the reflected environment direction", () => {
		const environmentMap = buildFixtureEnvironment();
		const lighting = { ...DEFAULT_LIGHTING, environmentMap, environmentIntensity: 1 };

		// Two very different normals reflect the view direction toward opposite
		// ends of the environment (sky-ish vs ground-ish), so a polished metal
		// should read distinctly differently between them -- exactly the
		// grazing/directional reflection a flat ambient term structurally can't
		// produce (see the comment on evaluateMaterial's ambient term).
		const responseA = evaluateMaterial(metal, lighting, normalAtT(0, basis));
		const responseB = evaluateMaterial(metal, lighting, normalAtT(1, basis));

		expect(responseA).not.toEqual(responseB);
	});

	it("increasing environmentIntensity monotonically changes a polished metal's response at a fixed normal", () => {
		const environmentMap = buildFixtureEnvironment();
		let prevMax = -Infinity;
		for (let i = 0; i <= 10; i++) {
			const environmentIntensity = i / 10;
			const response = evaluateMaterial(
				metal,
				{ ...DEFAULT_LIGHTING, environmentMap, environmentIntensity },
				fixedNormal
			);
			const maxChannel = Math.max(response.r, response.g, response.b);
			expect(maxChannel).toBeGreaterThanOrEqual(prevMax - 1e-9);
			prevMax = maxChannel;
		}
	});
});

describe("evaluateBaseColor", () => {
	const dielectric = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 0,
		roughness: 0.9,
	};
	const metal = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 1,
		roughness: 0.4,
	};

	it("is exactly black when lightIntensity=0 AND ambientIntensity=0, and no environment map", () => {
		const darkLighting = {
			...DEFAULT_LIGHTING,
			directionalLightIntensity: 0,
			ambientLightIntensity: 0,
		};
		expect(evaluateBaseColor(dielectric, darkLighting)).toEqual({
			r: 0,
			g: 0,
			b: 0,
		});
		expect(evaluateBaseColor(metal, darkLighting)).toEqual({
			r: 0,
			g: 0,
			b: 0,
		});
	});

	it("is deterministic across repeated calls", () => {
		const a = evaluateBaseColor(dielectric, DEFAULT_LIGHTING);
		const b = evaluateBaseColor(dielectric, DEFAULT_LIGHTING);
		expect(a).toEqual(b);
	});

	it("is exactly evaluateMaterial evaluated at N=viewDir", () => {
		// This is the equivalence that keeps the "Base" ramp stop match
		// (rampNaming.ts/MaterialRampPreview.tsx) and the solved albedo
		// (solveAlbedo.ts) consistent with what actually gets rendered: both
		// compare against the same function the ramp itself is built from,
		// rather than a separate simplified approximation.
		for (const material of [dielectric, metal]) {
			expect(evaluateBaseColor(material, DEFAULT_LIGHTING)).toEqual(
				evaluateMaterial(material, DEFAULT_LIGHTING, DEFAULT_LIGHTING.viewDir)
			);
		}
	});

	it("keeps a pure metal's response non-black via the ambient Fresnel term, even though its diffuse albedo is zero", () => {
		const response = evaluateBaseColor(metal, DEFAULT_LIGHTING);
		expect(Math.max(response.r, response.g, response.b)).toBeGreaterThan(0);
	});

	it("each output channel depends only on the matching input baseColor channel, holding metallic/roughness/lighting fixed", () => {
		// This is the mathematical premise the per-channel binary-search solver
		// (solveAlbedo.ts) relies on: no cross-channel coupling anywhere in the
		// formula (sRGB<->linear, the metallic/f0 lerp, the diffuse scale, the
		// direct-light specular lobe's Fresnel term, the ambient/env Fresnel
		// terms, and the Reinhard tonemap are all per-channel-pointwise).
		const fixedGB = { g: 120, b: 90 };
		let prevR = -Infinity;
		let firstG: number | null = null;
		let firstB: number | null = null;
		for (let r = 0; r <= 255; r += 17) {
			const response = evaluateBaseColor(
				{ baseColor: { r, ...fixedGB }, metallic: 0.5, roughness: 0.5 },
				DEFAULT_LIGHTING
			);
			expect(response.r).toBeGreaterThanOrEqual(prevR - 1e-9);
			prevR = response.r;
			if (firstG === null) {
				firstG = response.g;
				firstB = response.b;
			} else {
				expect(response.g).toBeCloseTo(firstG, 12);
				expect(response.b).toBeCloseTo(firstB as number, 12);
			}
		}
	});
});
