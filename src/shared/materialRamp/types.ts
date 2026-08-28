import { EnvironmentMap } from "./environmentMap";

export interface RgbLinear {
	r: number;
	g: number;
	b: number;
}

export type Vec3 = readonly [number, number, number];

export interface MaterialDefinition {
	baseColor: { r: number; g: number; b: number }; // sRGB 0-255
	metallic: number; // 0..1
	roughness: number; // 0..1
}

export interface LightingConfig {
	directionalLightColor: { r: number; g: number; b: number }; // sRGB 0-255
	directionalLightDir: Vec3; // normalized
	viewDir: Vec3; // normalized
	directionalLightIntensity: number; // fixed reference radiance scalar
	ambientLightColor: { r: number; g: number; b: number }; // sRGB 0-255
	ambientLightIntensity: number; // flat diffuse fill, independent of the orientation sweep
	// Optional real image-based reflection/irradiance, layered additively on
	// top of the flat ambient term above (see brdf.ts) -- absent/null
	// reproduces today's flat-ambient-only behavior exactly.
	environmentMap?: EnvironmentMap | null;
	environmentIntensity: number;
}

// L and V must NOT be coincident. If they were, H = normalize(L+V) would
// equal both of them, pinning VdotH = 1 permanently and making Fresnel a
// compile-time constant — silently defeating the entire point of sweeping a
// per-sample normal N. With L,V fixed and non-coincident (phi = angle
// between them), VdotH = cos(phi/2) is STILL constant across the whole
// sweep (H depends only on L and V, never on N) — this is structural, true
// for any N(t) curve, not a quirk of this specific phi=45deg choice. There
// is no phi that both keeps the surface camera-visible across the whole
// sweep (N·V >= 0) AND produces a visually meaningful Fresnel grazing
// effect (needs VdotH ~ 0.37, i.e. phi ~ 137deg, which pushes N·V deeply
// negative for most of the domain). Don't "fix" apparent flatness later by
// tuning phi — it can't work. Real grazing/Fresnel rim brightening comes
// from environment/IBL lighting (integrating over a hemisphere of incoming
// light, which genuinely depends on NdotV), not a single punctual light's
// specular term evaluated at one fixed L,V pair. What phi=45 deg DOES give:
// N·L sweeps monotonically 0->1 (clean dark->lit diffuse gradient), N·V
// stays comfortably positive throughout, and the specular peak (N aligned
// with H) lands at an interior sweep position (t = 1 - phi/180deg = 0.75),
// giving adaptive posterization real, material-dependent signal.
// lightIntensity/ambientIntensity are calibrated together against the
// Reinhard tonemap (colorSpace.ts reinhardTonemap: c/(1+c)), which compresses
// every non-zero value -- LIGHT_POWER (brdf.ts) only cancels the diffuse
// term's 1/pi, it does NOT make lightIntensity=1 reproduce the base color
// post-tonemap. At the old defaults (1.0/0.15) a light base color like
// #E4E4E4 came back ~145 (57%) at its brightest point and ~93 (36%) in
// shadow -- muddy for materials that aren't meant to read as dark. These
// values were picked so a light base color's lit side lands close to its own
// brightness and its shadow side stays a visible mid-gray rather than
// crushing toward black, while still leaving headroom for specular
// highlights on low-roughness/metallic materials to not clip to white.
export const DEFAULT_LIGHTING: LightingConfig = {
	directionalLightColor: { r: 255, g: 255, b: 255 },
	directionalLightDir: [Math.SQRT1_2, 0, Math.SQRT1_2], // phi = 45deg from viewDir
	directionalLightIntensity: 5.0,
	ambientLightColor: { r: 255, g: 255, b: 255 },
	ambientLightIntensity: 0.15,
	viewDir: [0, 0, 1],
	environmentMap: null,
	environmentIntensity: 1,
};

export interface MaterialRampStop {
	position: number; // 0..1 orientation-sweep position, NOT evenly spaced
	color: { r: number; g: number; b: number }; // sRGB 0-255
}
