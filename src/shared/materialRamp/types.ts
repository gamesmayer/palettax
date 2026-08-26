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
	lightColor: { r: number; g: number; b: number }; // sRGB 0-255
	lightDir: Vec3; // normalized
	viewDir: Vec3; // normalized
	lightIntensity: number; // fixed reference radiance scalar
	ambientColor: { r: number; g: number; b: number }; // sRGB 0-255
	ambientIntensity: number; // flat diffuse fill, independent of the orientation sweep
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
export const DEFAULT_LIGHTING: LightingConfig = {
	lightColor: { r: 255, g: 255, b: 255 },
	viewDir: [0, 0, 1],
	lightDir: [Math.SQRT1_2, 0, Math.SQRT1_2], // phi = 45deg from viewDir
	lightIntensity: 1.0,
	ambientColor: { r: 255, g: 255, b: 255 },
	ambientIntensity: 0.05,
};

export interface MaterialRampStop {
	position: number; // 0..1 orientation-sweep position, NOT evenly spaced
	color: { r: number; g: number; b: number }; // sRGB 0-255
}
