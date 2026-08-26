import { reinhardTonemap, rgbBytesToLinear } from "./colorSpace";
import { LightingConfig, MaterialDefinition, RgbLinear, Vec3 } from "./types";
import { dot3, normalize3 } from "./vec3";

const DIELECTRIC_F0 = 0.04;

// Cancels the diffuse term's 1/pi Lambertian normalization, so a material
// with a white albedo, viewed straight-on under the reference light
// (lightIntensity=1, NdotL=1), reads back at (approximately) full white
// rather than a muted ~0.3 fraction of it. This is standard PBR light-unit
// calibration (see e.g. Unreal/Unity's "candela" light intensity
// conventions), not an artistic exposure tweak -- it only affects overall
// brightness scale, not the shape of the response across the sweep.
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
	NdotL: number;
	NdotV: number;
	NdotH: number;
	VdotH: number;
}

function computeGeometry(lighting: LightingConfig, normal: Vec3): BrdfGeometry {
	const N = normalize3(normal);
	const L = normalize3(lighting.lightDir);
	const V = normalize3(lighting.viewDir);
	const H = normalize3([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
	return {
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
 * `lighting.ambientIntensity` * diffuse albedo, no 1/pi — it isn't a BRDF
 * lobe, just a fill light) so the response doesn't go to pure black
 * whenever `NdotL` reaches 0. Ambient only affects the diffuse response,
 * not specular — pure metals (metallic=1, no diffuse albedo) still go to
 * black without any direct light, since there's no environment map here for
 * their specular term to reflect.
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

	const lightLinear = rgbBytesToLinear(lighting.lightColor);
	const radiance = scaleRgb(
		lightLinear,
		lighting.lightIntensity * LIGHT_POWER * geometry.NdotL
	);
	const directLit = mulRgb(addRgb(diffuse, specular), radiance);

	const ambientLinear = rgbBytesToLinear(lighting.ambientColor);
	const ambientLit = scaleRgb(
		mulRgb(ambientLinear, albedoDiffuse),
		lighting.ambientIntensity
	);

	return reinhardTonemap(addRgb(directLit, ambientLit));
}
