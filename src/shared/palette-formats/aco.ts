import { cmykToRgb, generateId, hsvToRgb, labToRgb, rgbToHex } from "../color";
import { flattenGroups, wrapAsSingleGroup } from "../paletteGroups";
import { Palette, PaletteColor, PaletteParseError } from "../types";

function baseNameFromPath(filePath: string): string {
	const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
	return fileName.replace(/\.[^.]+$/, "");
}

const COLOR_SPACE_RGB = 0;
const COLOR_SPACE_HSB = 1;
const COLOR_SPACE_CMYK = 2;
const COLOR_SPACE_LAB = 7;
const COLOR_SPACE_GRAY = 8;

const RAW_ENTRY_SIZE = 10; // colorSpace (2) + 4 x component (2)

function decodeColorSpace(
	view: DataView,
	offset: number,
	colorSpace: number
): { r: number; g: number; b: number } | null {
	if (colorSpace === COLOR_SPACE_RGB) {
		const r = view.getUint16(offset, false);
		const g = view.getUint16(offset + 2, false);
		const b = view.getUint16(offset + 4, false);
		return { r: (r / 65535) * 255, g: (g / 65535) * 255, b: (b / 65535) * 255 };
	}
	if (colorSpace === COLOR_SPACE_HSB) {
		const h = (view.getUint16(offset, false) / 65535) * 360;
		const s = (view.getUint16(offset + 2, false) / 65535) * 100;
		const br = (view.getUint16(offset + 4, false) / 65535) * 100;
		return hsvToRgb(h, s, br);
	}
	if (colorSpace === COLOR_SPACE_CMYK) {
		const c = 100 - (view.getUint16(offset, false) / 65535) * 100;
		const m = 100 - (view.getUint16(offset + 2, false) / 65535) * 100;
		const y = 100 - (view.getUint16(offset + 4, false) / 65535) * 100;
		const k = 100 - (view.getUint16(offset + 6, false) / 65535) * 100;
		return cmykToRgb(c, m, y, k);
	}
	if (colorSpace === COLOR_SPACE_LAB) {
		const l = view.getUint16(offset, false) / 100;
		const a = view.getInt16(offset + 2, false) / 100;
		const b = view.getInt16(offset + 4, false) / 100;
		return labToRgb(l, a, b);
	}
	if (colorSpace === COLOR_SPACE_GRAY) {
		const percent = view.getUint16(offset, false) / 100;
		const v = (percent / 100) * 255;
		return { r: v, g: v, b: v };
	}
	return null;
}

function toColor(
	rgb: { r: number; g: number; b: number },
	name?: string
): PaletteColor {
	return {
		id: generateId(),
		r: Math.round(rgb.r),
		g: Math.round(rgb.g),
		b: Math.round(rgb.b),
		hex: rgbToHex(rgb.r, rgb.g, rgb.b),
		name: name && name.length > 0 ? name : undefined,
	};
}

function readNameAco(
	view: DataView,
	offset: number
): { name: string; nextOffset: number } {
	const charCount = view.getUint32(offset, false); // includes trailing NUL
	let cursor = offset + 4;
	let name = "";
	for (let i = 0; i < charCount - 1; i++) {
		name += String.fromCharCode(view.getUint16(cursor, false));
		cursor += 2;
	}
	cursor += 2; // skip trailing NUL
	return { name, nextOffset: cursor };
}

function writeNameAco(view: DataView, offset: number, name: string): number {
	view.setUint32(offset, name.length + 1, false);
	let cursor = offset + 4;
	for (let i = 0; i < name.length; i++) {
		view.setUint16(cursor, name.charCodeAt(i), false);
		cursor += 2;
	}
	view.setUint16(cursor, 0, false);
	return cursor + 2;
}

function parseV1Block(
	view: DataView,
	bytes: Uint8Array,
	startOffset: number,
	count: number
): { colors: PaletteColor[]; endOffset: number } {
	const colors: PaletteColor[] = [];
	let offset = startOffset;
	for (let i = 0; i < count; i++) {
		if (offset + RAW_ENTRY_SIZE > bytes.length) break;
		const colorSpace = view.getUint16(offset, false);
		const rgb = decodeColorSpace(view, offset + 2, colorSpace);
		if (rgb) colors.push(toColor(rgb));
		offset += RAW_ENTRY_SIZE;
	}
	return { colors, endOffset: offset };
}

function parseV2Block(
	view: DataView,
	bytes: Uint8Array,
	startOffset: number,
	count: number
): { colors: PaletteColor[]; endOffset: number } {
	const colors: PaletteColor[] = [];
	let offset = startOffset;
	for (let i = 0; i < count; i++) {
		try {
			if (offset + RAW_ENTRY_SIZE > bytes.length) throw new Error("truncated");
			const colorSpace = view.getUint16(offset, false);
			const rgb = decodeColorSpace(view, offset + 2, colorSpace);
			const { name, nextOffset } = readNameAco(view, offset + RAW_ENTRY_SIZE);
			if (nextOffset > bytes.length) throw new Error("truncated");
			if (rgb) colors.push(toColor(rgb, name));
			offset = nextOffset;
		} catch {
			break;
		}
	}
	return { colors, endOffset: offset };
}

export function parseAco(content: string, filePath: string): Palette {
	const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0) & 0xff);
	const view = new DataView(bytes.buffer);

	if (bytes.length < 4) {
		throw new PaletteParseError(
			"The file is too short to contain a valid ACO header."
		);
	}

	const firstVersion = view.getUint16(0, false);
	if (firstVersion !== 1 && firstVersion !== 2) {
		throw new PaletteParseError(
			"The file does not have a recognized ACO version."
		);
	}

	let colors: PaletteColor[];
	if (firstVersion === 2) {
		const count = view.getUint16(2, false);
		colors = parseV2Block(view, bytes, 4, count).colors;
	} else {
		const count1 = view.getUint16(2, false);
		const v1Result = parseV1Block(view, bytes, 4, count1);
		colors = v1Result.colors;
		const v2HeaderOffset = v1Result.endOffset;
		if (
			v2HeaderOffset + 4 <= bytes.length &&
			view.getUint16(v2HeaderOffset, false) === 2
		) {
			const count2 = view.getUint16(v2HeaderOffset + 2, false);
			colors = parseV2Block(view, bytes, v2HeaderOffset + 4, count2).colors;
		}
	}

	if (colors.length === 0) {
		throw new PaletteParseError(
			"The file does not contain any recognizable ACO color."
		);
	}

	return {
		id: generateId(),
		name: baseNameFromPath(filePath),
		groups: wrapAsSingleGroup(colors),
		sourceFormat: "aco",
		filePath,
	};
}

const NAME_LENGTH_FIELD_SIZE = 4; // uint32 char count prefix

function utf16beByteLength(name: string): number {
	return (name.length + 1) * 2; // chars + trailing NUL
}

function nameFieldSize(name: string): number {
	return NAME_LENGTH_FIELD_SIZE + utf16beByteLength(name);
}

function to16(value: number): number {
	return Math.max(0, Math.min(65535, Math.round((value / 255) * 65535)));
}

function writeRawRgbEntry(
	view: DataView,
	offset: number,
	color: PaletteColor
): number {
	view.setUint16(offset, COLOR_SPACE_RGB, false);
	view.setUint16(offset + 2, to16(color.r), false);
	view.setUint16(offset + 4, to16(color.g), false);
	view.setUint16(offset + 6, to16(color.b), false);
	view.setUint16(offset + 8, 0, false);
	return offset + RAW_ENTRY_SIZE;
}

export function serializeAco(palette: Palette): string {
	const colors = flattenGroups(palette.groups);

	const v1Size = 4 + colors.length * RAW_ENTRY_SIZE;
	const v2Size =
		4 +
		colors.reduce(
			(sum, color) => sum + RAW_ENTRY_SIZE + nameFieldSize(color.name ?? ""),
			0
		);
	const totalSize = v1Size + v2Size;

	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);

	view.setUint16(0, 1, false);
	view.setUint16(2, colors.length, false);
	let offset = 4;
	for (const color of colors) {
		offset = writeRawRgbEntry(view, offset, color);
	}

	view.setUint16(offset, 2, false);
	view.setUint16(offset + 2, colors.length, false);
	offset += 4;
	for (const color of colors) {
		offset = writeRawRgbEntry(view, offset, color);
		offset = writeNameAco(view, offset, color.name ?? "");
	}

	const bytes = new Uint8Array(buffer);
	const CHUNK_SIZE = 8192;
	let result = "";
	for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
		result += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
	}
	return result;
}
