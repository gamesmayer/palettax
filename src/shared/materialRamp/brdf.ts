import { reinhardTonemap, rgbBytesToLinear } from "./colorSpace";
import { sampleEnvironment } from "./environmentMap";
import { LightingConfig, MaterialDefinition, RgbLinear, Vec3 } from "./types";
import { dot3, normalize3, reflect3 } from "./vec3";

const DIELECTRIC_F0 = 0.04;

// Cancels the diffuse term's 1/pi Lambertian normalization, so pre-tonemap
// radiance for a white albedo under the reference light (lightIntensity=1,
// NdotL=1) is the albedo itself rather than a muted ~0.3 fraction of it. This
// is standard PBR light-unit calibration (see e.g. Unreal/Unity's "candela"
// light intensity conventions), not an artistic exposure tweak -- it only
// affects overall brightness scale, not the shape of the response across the
// sweep. Note this is a pre-tonemap statement: reinhardTonemap (c/(1+c))
// still compresses that radiance afterward, so actual DEFAULT_LIGHTING
// intensities are chosen post-tonemap against the curve, not from this
// constant alone -- see the comment on DEFAULT_LIGHTING in lightingConstants.ts.
const LIGHT_POWER = Math.PI;

/** Trowbridge-Reitz / GGX normal distribution function. */
export function ggxDistribution(NdotH: number, alpha: number): number {
	const alpha2 = alpha * alpha;
	const denom = NdotH * NdotH * (alpha2 - 1) + 1;
	return alpha2 / (Math.PI * denom * denom);
}

/** Schlick-GGX geometry term for a single direction (light or view). */
export function schlickGGXGeometry(NdotX: number, alpha: number): number {
	const k = alpha / 2; // direct-lighting remap
	return NdotX / (NdotX * (1 - k) + k);
}

/** Smith geometry term: combines the light- and view-direction terms. */
export function smithGeometry(
	NdotL: number,
	NdotV: number,
	alpha: number
): number {
	return schlickGGXGeometry(NdotL, alpha) * schlickGGXGeometry(NdotV, alpha);
}

/** Schlick Fresnel approximation with a colored F0 (for the metallic workflow). */
export function schlickFresnel(VdotH: number, f0: RgbLinear): RgbLinear {
	const factor = (1 - VdotH) ** 5;
	return {
		r: f0.r + (1 - f0.r) * factor,
		g: f0.g + (1 - f0.g) * factor,
		b: f0.b + (1 - f0.b) * factor,
	};
}

function lerpRgb(a: RgbLinear, b: RgbLinear, t: number): RgbLinear {
	return {
		r: a.r + (b.r - a.r) * t,
		g: a.g + (b.g - a.g) * t,
		b: a.b + (b.b - a.b) * t,
	};
}

function scaleRgb(rgb: RgbLinear, s: number): RgbLinear {
	return { r: rgb.r * s, g: rgb.g * s, b: rgb.b * s };
}

function addRgb(a: RgbLinear, b: RgbLinear): RgbLinear {
	return { r: a.r + b.r, g: a.g + b.g, b: a.b + b.b };
}

function mulRgb(a: RgbLinear, b: RgbLinear): RgbLinear {
	return { r: a.r * b.r, g: a.g * b.g, b: a.b * b.b };
}

interface BrdfGeometry {
	N: Vec3;
	V: Vec3;
	NdotL: number;
	NdotV: number;
	NdotH: number;
	VdotH: number;
}

function computeGeometry(lighting: LightingConfig, normal: Vec3): BrdfGeometry {
	const N = normalize3(normal);
	const L = normalize3(lighting.directionalLightDir);
	const V = normalize3(lighting.viewDir);
	const H = normalize3([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
	return {
		N,
		V,
		NdotL: Math.max(dot3(N, L), 1e-4),
		NdotV: Math.max(dot3(N, V), 1e-4),
		NdotH: Math.max(dot3(N, H), 0),
		VdotH: Math.max(dot3(V, H), 0),
	};
}

/**
 * Continuous physically-based material response: evaluates a simplified
 * Cook-Torrance/GGX BRDF at one explicit surface normal and returns the
 * (tonemapped, linear-space) lit color. This function is domain-agnostic —
 * it evaluates a single point of the BRDF given fully explicit
 * `(material, lighting, normal)`; the caller decides what varies across a
 * sweep (surface orientation, via `normal`, is what the ramp generator
 * sweeps today — nothing here prevents a future caller from instead
 * sweeping `lighting.lightIntensity` at a fixed normal).
 *
 * Also adds a flat ambient-fill term (`lighting.ambientColor` *
 * `lighting.ambientIntensity`, no 1/pi — it isn't a BRDF lobe, just a fill
 * light) so the response doesn't go to pure black whenever `NdotL` reaches
 * 0. Ambient has two components: a diffuse part scaled by the diffuse
 * albedo (zero for pure metals), and a specular part scaled by
 * `schlickFresnel(NdotV, f0)` — the standard cheap approximation for
 * specular IBL from a uniform, unprefiltered environment. Since the ambient
 * color has no directional/reflection content, convolving it with any BRDF
 * lobe returns the same flat value regardless of roughness, so this term is
 * deliberately roughness-independent. This is what keeps pure metals
 * (metallic=1, no diffuse albedo) from going to pure black without direct
 * light.
 */
export function evaluateMaterial(
	material: MaterialDefinition,
	lighting: LightingConfig,
	normal: Vec3
): RgbLinear {
	const baseLinear = rgbBytesToLinear(material.baseColor);
	const dielectricF0: RgbLinear = {
		r: DIELECTRIC_F0,
		g: DIELECTRIC_F0,
		b: DIELECTRIC_F0,
	};
	const f0 = lerpRgb(dielectricF0, baseLinear, material.metallic);
	const albedoDiffuse = scaleRgb(baseLinear, 1 - material.metallic);
	const alpha = Math.max(material.roughness * material.roughness, 1e-4);

	const geometry = computeGeometry(lighting, normal);
	const D = ggxDistribution(geometry.NdotH, alpha);
	const G = smithGeometry(geometry.NdotL, geometry.NdotV, alpha);
	const F = schlickFresnel(geometry.VdotH, f0);

	const specularDenom = Math.max(4 * geometry.NdotV * geometry.NdotL, 1e-4);
	const specular = scaleRgb(F, (D * G) / specularDenom);

	const kd = scaleRgb(
		{ r: 1 - F.r, g: 1 - F.g, b: 1 - F.b },
		1 - material.metallic
	);
	const diffuse = scaleRgb(mulRgb(kd, albedoDiffuse), 1 / Math.PI);

	const lightLinear = rgbBytesToLinear(lighting.directionalLightColor);
	const radiance = scaleRgb(
		lightLinear,
		lighting.directionalLightIntensity * LIGHT_POWER * geometry.NdotL
	);
	const directLit = mulRgb(addRgb(diffuse, specular), radiance);

	const ambientLinear = rgbBytesToLinear(lighting.ambientLightColor);
	const fresnelAmbient = schlickFresnel(geometry.NdotV, f0);
	const ambientDiffuse = scaleRgb(
		mulRgb(ambientLinear, albedoDiffuse),
		lighting.ambientLightIntensity
	);
	const ambientSpecular = scaleRgb(
		mulRgb(ambientLinear, fresnelAmbient),
		lighting.ambientLightIntensity
	);
	const ambientLit = addRgb(ambientDiffuse, ambientSpecular);

	// Real image-based reflection, additive on top of the flat ambient term
	// above rather than a replacement for it -- keeps existing output
	// unchanged when environmentMap is unset. Diffuse side samples the
	// environment at N with a fully-blurred lookup (roughness=1, i.e. an
	// irradiance-ish average) since Lambertian diffuse has no reflection
	// direction; specular side samples at the true mirror direction with the
	// material's own roughness, so polished/low-roughness materials get a
	// sharp reflection and rough ones get a soft one.
	const envLit = lighting.environmentMap
		? scaleRgb(
				addRgb(
					mulRgb(
						sampleEnvironment(lighting.environmentMap, geometry.N, 1),
						albedoDiffuse
					),
					mulRgb(
						sampleEnvironment(
							lighting.environmentMap,
							reflect3(geometry.V, geometry.N),
							material.roughness
						),
						fresnelAmbient
					)
				),
				lighting.environmentIntensity
			)
		: { r: 0, g: 0, b: 0 };

	return reinhardTonemap(addRgb(addRgb(directLit, ambientLit), envLit));
}

/**
 * "Neutral" material response used to back-solve albedo from a desired
 * target appearance (see solveAlbedo.ts). Structurally evaluateMaterial's
 * body with the direct-light GGX specular lobe (D, G, and their
 * contribution to directLit) removed, evaluated at a fixed normal N =
 * lighting.viewDir -- NdotV = 1 exactly, which makes schlickFresnel(NdotV,
 * f0) reduce to exactly f0 (zero grazing brightening), so the Fresnel-tinted
 * ambient/env specular terms read as a clean, un-distorted reflectance tint.
 * Deliberately keeps those terms (rather than dropping specular entirely)
 * because they're what keeps pure metals (metallic=1, zero diffuse albedo)
 * from evaluating to black -- only the sharp, geometry-dependent highlight
 * lobe is excluded, not the material's overall reflective color.
 */
export function evaluateNeutralBaseColor(
	material: MaterialDefinition,
	lighting: LightingConfig
): RgbLinear {
	const baseLinear = rgbBytesToLinear(material.baseColor);
	const dielectricF0: RgbLinear = {
		r: DIELECTRIC_F0,
		g: DIELECTRIC_F0,
		b: DIELECTRIC_F0,
	};
	const f0 = lerpRgb(dielectricF0, baseLinear, material.metallic);
	const albedoDiffuse = scaleRgb(baseLinear, 1 - material.metallic);

	const geometry = computeGeometry(lighting, lighting.viewDir);

	// Still needed for kd (the diffuse energy-conservation term) even though
	// the specular lobe it originally fed (D, G) is dropped below.
	const F = schlickFresnel(geometry.VdotH, f0);
	const kd = scaleRgb(
		{ r: 1 - F.r, g: 1 - F.g, b: 1 - F.b },
		1 - material.metallic
	);
	const diffuse = scaleRgb(mulRgb(kd, albedoDiffuse), 1 / Math.PI);

	const lightLinear = rgbBytesToLinear(lighting.directionalLightColor);
	const radiance = scaleRgb(
		lightLinear,
		lighting.directionalLightIntensity * LIGHT_POWER * geometry.NdotL
	);
	const directLit = mulRgb(diffuse, radiance);

	const ambientLinear = rgbBytesToLinear(lighting.ambientLightColor);
	const fresnelAmbient = schlickFresnel(geometry.NdotV, f0);
	const ambientDiffuse = scaleRgb(
		mulRgb(ambientLinear, albedoDiffuse),
		lighting.ambientLightIntensity
	);
	const ambientSpecular = scaleRgb(
		mulRgb(ambientLinear, fresnelAmbient),
		lighting.ambientLightIntensity
	);
	const ambientLit = addRgb(ambientDiffuse, ambientSpecular);

	const envLit = lighting.environmentMap
		? scaleRgb(
				addRgb(
					mulRgb(
						sampleEnvironment(lighting.environmentMap, geometry.N, 1),
						albedoDiffuse
					),
					mulRgb(
						sampleEnvironment(
							lighting.environmentMap,
							reflect3(geometry.V, geometry.N),
							material.roughness
						),
						fresnelAmbient
					)
				),
				lighting.environmentIntensity
			)
		: { r: 0, g: 0, b: 0 };

	return reinhardTonemap(addRgb(addRgb(directLit, ambientLit), envLit));
}
