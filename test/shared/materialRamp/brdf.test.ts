import { encode } from "fast-png";
import {
	evaluateMaterial,
	evaluateNeutralBaseColor,
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
import { posterize } from "../../../src/shared/materialRamp/posterize";

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

describe("evaluateMaterial + posterize (point-16 scenario)", () => {
	// Same base color, four materials spanning the metallic/roughness corners
	// (spec point 16): A rough dielectric, B glossy dielectric, C glossy
	// metal, D rough metal. Same requested stop count for all four. Adaptive
	// posterization should NOT produce the same (or evenly-spaced) stop
	// positions for every material -- glossy materials should cluster stops
	// tightly around the analytic specular-peak sweep position, rough
	// materials should spread stops more broadly across the domain.
	const baseColor = { r: 180, g: 120, b: 90 };
	const materialA = { baseColor, metallic: 0, roughness: 0.9 };
	const materialB = { baseColor, metallic: 0, roughness: 0.15 };
	const materialC = { baseColor, metallic: 1, roughness: 0.15 };
	const materialD = { baseColor, metallic: 1, roughness: 0.8 };

	const basis = computeSweepBasis(DEFAULT_LIGHTING);
	// t = 1 - phi/180deg (phi in degrees) = 1 - phi_radians/PI. NOT phi/(PI/2)
	// -- that would be double the correct subtraction. See the derivation in
	// orientationSweep.ts (whose normalAtT implements this correctly; this
	// constant only re-derives the peak position for test assertions).
	const specularPeakT = 1 - basis.phi / Math.PI;

	function rampPositions(
		material: typeof materialA,
		stopCount: number,
		sampleWidth = 513
	): number[] {
		const dense = [];
		for (let i = 0; i < sampleWidth; i++) {
			const t = i / (sampleWidth - 1);
			dense.push({
				t,
				rgbLinear: evaluateMaterial(
					material,
					DEFAULT_LIGHTING,
					normalAtT(t, basis)
				),
			});
		}
		return posterize(dense, stopCount).map((s) => s.position);
	}

	it("produces different stop-position distributions for glossy vs. rough materials", () => {
		const positionsA = rampPositions(materialA, 7);
		const positionsB = rampPositions(materialB, 7);
		const positionsC = rampPositions(materialC, 7);
		const positionsD = rampPositions(materialD, 7);

		expect(positionsB).not.toEqual(positionsA);
		expect(positionsC).not.toEqual(positionsD);
	});

	it("glossy materials cluster the majority of their interior stops near the analytic specular-peak position", () => {
		const inNarrowBand = (p: number): boolean =>
			Math.abs(p - specularPeakT) <= 0.2;

		const positionsB = rampPositions(materialB, 7);
		const positionsC = rampPositions(materialC, 7);
		const positionsA = rampPositions(materialA, 7);
		const positionsD = rampPositions(materialD, 7);

		// Interior stops only (exclude the always-preserved 0/1 endpoints).
		const interiorFraction = (positions: number[]): number => {
			const interior = positions.slice(1, -1);
			return interior.filter(inNarrowBand).length / interior.length;
		};

		expect(interiorFraction(positionsB)).toBeGreaterThan(
			interiorFraction(positionsA)
		);
		expect(interiorFraction(positionsC)).toBeGreaterThan(
			interiorFraction(positionsD)
		);
	});

	it("glossy materials place multiple stops within a tight band around the specular peak, rough materials place at most one", () => {
		// A global "smallest gap anywhere" comparison is confounded by the
		// near-black OKLab compression artifact (see PERCEPTUAL_FLOOR in
		// posterize.ts) landing the same finest bisection step for every
		// material regardless of its specular behavior. Restricting to a
		// tight band around the analytic peak isolates the actual signal:
		// does this material's response have enough local curvature there to
		// pull more than one stop into a narrow neighborhood?
		const inTightBand = (p: number): boolean =>
			Math.abs(p - specularPeakT) <= 0.1;
		const countInTightBand = (positions: number[]): number =>
			positions.filter(inTightBand).length;

		expect(countInTightBand(rampPositions(materialB, 7))).toBeGreaterThan(
			countInTightBand(rampPositions(materialA, 7))
		);
		expect(countInTightBand(rampPositions(materialC, 7))).toBeGreaterThan(
			countInTightBand(rampPositions(materialD, 7))
		);
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

describe("evaluateNeutralBaseColor", () => {
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
		expect(evaluateNeutralBaseColor(dielectric, darkLighting)).toEqual({
			r: 0,
			g: 0,
			b: 0,
		});
		expect(evaluateNeutralBaseColor(metal, darkLighting)).toEqual({
			r: 0,
			g: 0,
			b: 0,
		});
	});

	it("is deterministic across repeated calls", () => {
		const a = evaluateNeutralBaseColor(dielectric, DEFAULT_LIGHTING);
		const b = evaluateNeutralBaseColor(dielectric, DEFAULT_LIGHTING);
		expect(a).toEqual(b);
	});

	it("never exceeds evaluateMaterial's response at N=viewDir, since it drops the (non-negative) direct-light specular highlight", () => {
		// This is an exact structural fact, not an approximation: directLit here
		// is mulRgb(diffuse, radiance) instead of
		// mulRgb(addRgb(diffuse, specular), radiance), and specular/radiance are
		// both non-negative -- so the neutral response can only be <= the full
		// response at the same normal, for every material/lighting combination.
		for (const material of [dielectric, metal]) {
			const neutral = evaluateNeutralBaseColor(material, DEFAULT_LIGHTING);
			const full = evaluateMaterial(
				material,
				DEFAULT_LIGHTING,
				DEFAULT_LIGHTING.viewDir
			);
			expect(neutral.r).toBeLessThanOrEqual(full.r + 1e-9);
			expect(neutral.g).toBeLessThanOrEqual(full.g + 1e-9);
			expect(neutral.b).toBeLessThanOrEqual(full.b + 1e-9);
		}
	});

	it("keeps a pure metal's response non-black via the ambient Fresnel term, even though its diffuse albedo is zero", () => {
		const response = evaluateNeutralBaseColor(metal, DEFAULT_LIGHTING);
		expect(Math.max(response.r, response.g, response.b)).toBeGreaterThan(0);
	});

	it("each output channel depends only on the matching input baseColor channel, holding metallic/roughness/lighting fixed", () => {
		// This is the mathematical premise the per-channel binary-search solver
		// (solveAlbedo.ts) relies on: no cross-channel coupling anywhere in the
		// formula (sRGB<->linear, the metallic/f0 lerp, the diffuse scale, the
		// Fresnel terms, and the Reinhard tonemap are all per-channel-pointwise).
		const fixedGB = { g: 120, b: 90 };
		let prevR = -Infinity;
		let firstG: number | null = null;
		let firstB: number | null = null;
		for (let r = 0; r <= 255; r += 17) {
			const response = evaluateNeutralBaseColor(
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
