export interface MaterialPreset {
	name: string;
	metallic: number;
	roughness: number;
	examples: string;
}

// Common PBR reference presets -- metallic/roughness pairs only, no hue or
// hardcoded color: base color stays whatever the user picked. These are
// standard parameter combinations (matching typical engine/tool reference
// charts), not artistic color transforms -- they just set the two physical
// parameters the existing BRDF already understands. `examples` are real-world
// surfaces to help pick a preset by eye rather than by roughness/metallic
// numbers.
export const MATERIAL_PRESETS: MaterialPreset[] = [
	{
		name: "Skin",
		metallic: 0,
		roughness: 0.4,
		examples: "human skin, faces, hands",
	},
	{
		name: "Fabric",
		metallic: 0,
		roughness: 0.85,
		examples: "cloth, canvas, upholstery, carpet",
	},
	{
		name: "Wood",
		metallic: 0,
		roughness: 0.6,
		examples: "furniture, floorboards, crates, tool handles",
	},
	{
		name: "Rough plastic",
		metallic: 0,
		roughness: 0.8,
		examples: "toy bricks, bottle caps, appliance casings, PVC pipe",
	},
	{
		name: "Smooth plastic",
		metallic: 0,
		roughness: 0.15,
		examples: "glossy packaging, plastic buttons, phone cases, laminate",
	},
	{
		name: "Rubber",
		metallic: 0,
		roughness: 0.95,
		examples: "tires, rubber grips, hoses, shoe soles",
	},
	{
		name: "Brushed metal",
		metallic: 1,
		roughness: 0.4,
		examples:
			"stainless steel appliances, brushed aluminum panels, elevator doors",
	},
	{
		name: "Polished metal",
		metallic: 1,
		roughness: 0.05,
		examples: "chrome trim, mirrors, cutlery, jewelry",
	},
	{
		name: "Rusted metal",
		metallic: 0.4,
		roughness: 0.85,
		examples: "old pipes, weathered railings, corroded machinery",
	},
	{
		name: "Ceramic",
		metallic: 0,
		roughness: 0.2,
		examples: "tiles, porcelain, glazed pottery, sinks",
	},
];
