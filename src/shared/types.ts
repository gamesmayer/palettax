export type PaletteFormat =
	"pal" | "gpl" | "txt" | "css" | "ase" | "aco" | "png";

export interface PaletteColor {
	id: string;
	r: number;
	g: number;
	b: number;
	hex: string;
	name?: string;
}

export interface PaletteGroup {
	id: string;
	name?: string;
	colors: PaletteColor[];
}

export interface Palette {
	id: string;
	name: string;
	groups: PaletteGroup[];
	sourceFormat: PaletteFormat;
	filePath?: string;
	columns?: number;
}

export class PaletteParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PaletteParseError";
	}
}
