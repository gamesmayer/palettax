import { MATERIAL_PRESETS } from "./materialPresets";

export const MIN_UNIT = 0;
export const MAX_UNIT = 1;
export const MIN_STOPS = 2;
export const MAX_STOPS = 32;
export const DEFAULT_STOP_COUNT = 16;

// Named lookup rather than MATERIAL_PRESETS[0] -- the default shouldn't
// silently change if the preset list gets reordered.
const DEFAULT_PRESET =
	MATERIAL_PRESETS.find((preset) => preset.name === "Skin") ??
	MATERIAL_PRESETS[0];
export const DEFAULT_METALLIC = DEFAULT_PRESET.metallic;
export const DEFAULT_ROUGHNESS = DEFAULT_PRESET.roughness;
export const DEFAULT_TARGET_BASE_COLOR = { r: 0xc8, g: 0xa0, b: 0x8b };

// OKLab L (perceptual lightness, 0=black, ~1=white). An albedo this close to
// either extreme leaves the BRDF almost no room to lighten or darken it
// further, so the generated ramp's bright or dark stops end up nearly
// identical to the albedo instead of forming a usable gradient.
export const ALBEDO_LIGHTNESS_WARN_HIGH = 0.92;
export const ALBEDO_LIGHTNESS_WARN_LOW = 0.08;
