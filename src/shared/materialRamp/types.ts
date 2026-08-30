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

export interface MaterialRampStop {
	color: { r: number; g: number; b: number }; // sRGB 0-255
}
