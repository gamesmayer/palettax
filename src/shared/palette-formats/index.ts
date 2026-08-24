export * from "../types";
export * from "./jascPal";
export * from "./gimpGpl";
export * from "./hexList";
export * from "./css";
export * from "./ase";
export * from "./aco";
export * from "./detectFormat";

import { Palette, PaletteFormat, PaletteParseError } from "../types";
import { parsePal, serializePal } from "./jascPal";
import { parseGpl, serializeGpl } from "./gimpGpl";
import { parseHexTxt, serializeHexTxt } from "./hexList";
import { parseCss, serializeCss } from "./css";
import { parseAse, serializeAse } from "./ase";
import { parseAco, serializeAco } from "./aco";
import { detectFormatByExtension } from "./detectFormat";

export function parsePaletteFile(filePath: string, content: string): Palette {
	const format = detectFormatByExtension(filePath);
	if (format === "pal") return parsePal(content, filePath);
	if (format === "gpl") return parseGpl(content, filePath);
	if (format === "txt") return parseHexTxt(content, filePath);
	if (format === "css") return parseCss(content, filePath);
	if (format === "ase") return parseAse(content, filePath);
	if (format === "aco") return parseAco(content, filePath);
	throw new PaletteParseError(`Unsupported extension: ${filePath}`);
}

export function serializePaletteFile(
	palette: Palette,
	format: PaletteFormat
): string {
	if (format === "pal") return serializePal(palette);
	if (format === "gpl") return serializeGpl(palette);
	if (format === "txt") return serializeHexTxt(palette);
	if (format === "ase") return serializeAse(palette);
	if (format === "aco") return serializeAco(palette);
	return serializeCss(palette);
}
