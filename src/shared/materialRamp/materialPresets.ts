export const MATERIAL_PRESET_IDS = [
	"skin",
	"fabric",
	"wood",
	"roughPlastic",
	"smoothPlastic",
	"rubber",
	"brushedMetal",
	"polishedMetal",
	"rustedMetal",
	"ceramic",
] as const;

export type MaterialPresetId = (typeof MATERIAL_PRESET_IDS)[number];

export interface MaterialPreset {
	id: MaterialPresetId;
	metallic: number;
	roughness: number;
}

// Common PBR reference presets -- metallic/roughness pairs only, no hue or
// hardcoded color: base color stays whatever the user picked. These are
// standard parameter combinations (matching typical engine/tool reference
// charts), not artistic color transforms -- they just set the two physical
// parameters the existing BRDF already understands. `id` is a stable,
// locale-independent key -- display name and example surfaces (real-world
// examples to help pick a preset by eye rather than by roughness/metallic
// numbers) live in the `app:materialPresets.<id>.*` translation keys, not
// here, so this list stays language-agnostic.
export const MATERIAL_PRESETS: MaterialPreset[] = [
	{ id: "skin", metallic: 0, roughness: 0.4 },
	{ id: "fabric", metallic: 0, roughness: 0.85 },
	{ id: "wood", metallic: 0, roughness: 0.6 },
	{ id: "roughPlastic", metallic: 0, roughness: 0.8 },
	{ id: "smoothPlastic", metallic: 0, roughness: 0.15 },
	{ id: "rubber", metallic: 0, roughness: 0.95 },
	{ id: "brushedMetal", metallic: 1, roughness: 0.4 },
	{ id: "polishedMetal", metallic: 1, roughness: 0.05 },
	{ id: "rustedMetal", metallic: 0.4, roughness: 0.85 },
	{ id: "ceramic", metallic: 0, roughness: 0.2 },
];
