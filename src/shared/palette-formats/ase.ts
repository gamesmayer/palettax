import { cmykToRgb, generateId, labToRgb, rgbToHex } from "../color";
import {
	Palette,
	PaletteColor,
	PaletteGroup,
	PaletteParseError,
} from "../types";

function baseNameFromPath(filePath: string): string {
	const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
	return fileName.replace(/\.[^.]+$/, "");
}

const SIGNATURE = "ASEF";
const BLOCK_GROUP_START = 0xc001;
const BLOCK_GROUP_END = 0xc002;
const BLOCK_COLOR_ENTRY = 0x0001;

function readName(
	view: DataView,
	offset: number
): { name: string; nextOffset: number } {
	const nameLength = view.getUint16(offset, false);
	let cursor = offset + 2;
	let name = "";
	for (let i = 0; i < nameLength; i++) {
		const code = view.getUint16(cursor, false);
		if (code !== 0) {
			name += String.fromCharCode(code);
		}
		cursor += 2;
	}
	return { name, nextOffset: cursor };
}

function readColorModel(view: DataView, offset: number): string {
	let model = "";
	for (let i = 0; i < 4; i++) {
		model += String.fromCharCode(view.getUint8(offset + i));
	}
	return model;
}

export function parseAse(content: string, filePath: string): Palette {
	const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0) & 0xff);
	const view = new DataView(bytes.buffer);

	if (
		bytes.length < 12 ||
		String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== SIGNATURE
	) {
		throw new PaletteParseError(
			"The file does not have a valid ASE signature."
		);
	}

	const blockCount = view.getUint32(8, false);
	let offset = 12;

	const groups: PaletteGroup[] = [];
	let currentGroup: PaletteGroup | null = null;
	let implicitGroup: PaletteGroup | null = null;

	function targetGroup(): PaletteGroup {
		if (currentGroup) return currentGroup;
		if (!implicitGroup) {
			implicitGroup = { id: generateId(), colors: [] };
			groups.push(implicitGroup);
		}
		return implicitGroup;
	}

	for (let i = 0; i < blockCount && offset + 6 <= bytes.length; i++) {
		const blockType = view.getUint16(offset, false);
		const blockLength = view.getUint32(offset + 2, false);
		const bodyStart = offset + 6;
		const bodyEnd = bodyStart + blockLength;
		if (bodyEnd > bytes.length) break;

		if (blockType === BLOCK_GROUP_START) {
			const { name } = readName(view, bodyStart);
			const group: PaletteGroup = {
				id: generateId(),
				name: name.length > 0 ? name : undefined,
				colors: [],
			};
			groups.push(group);
			currentGroup = group;
			implicitGroup = null;
		} else if (blockType === BLOCK_GROUP_END) {
			currentGroup = null;
		} else if (blockType === BLOCK_COLOR_ENTRY) {
			try {
				const { name, nextOffset } = readName(view, bodyStart);
				const model = readColorModel(view, nextOffset);
				let componentsOffset = nextOffset + 4;
				let rgb: { r: number; g: number; b: number };

				if (model === "RGB ") {
					const r = view.getFloat32(componentsOffset, false);
					const g = view.getFloat32(componentsOffset + 4, false);
					const b = view.getFloat32(componentsOffset + 8, false);
					rgb = { r: r * 255, g: g * 255, b: b * 255 };
				} else if (model === "Gray") {
					const value = view.getFloat32(componentsOffset, false) * 255;
					rgb = { r: value, g: value, b: value };
				} else if (model === "CMYK") {
					const c = view.getFloat32(componentsOffset, false) * 100;
					const m = view.getFloat32(componentsOffset + 4, false) * 100;
					const y = view.getFloat32(componentsOffset + 8, false) * 100;
					const k = view.getFloat32(componentsOffset + 12, false) * 100;
					rgb = cmykToRgb(c, m, y, k);
				} else if (model === "LAB ") {
					const l = view.getFloat32(componentsOffset, false);
					const a = view.getFloat32(componentsOffset + 4, false);
					const b = view.getFloat32(componentsOffset + 8, false);
					rgb = labToRgb(l, a, b);
				} else {
					offset = bodyEnd;
					continue;
				}

				const color: PaletteColor = {
					id: generateId(),
					r: Math.round(rgb.r),
					g: Math.round(rgb.g),
					b: Math.round(rgb.b),
					hex: rgbToHex(rgb.r, rgb.g, rgb.b),
					name: name.length > 0 ? name : undefined,
				};
				targetGroup().colors.push(color);
			} catch {
				// Skip malformed color entries rather than aborting the whole file.
			}
		}

		offset = bodyEnd;
	}

	const totalColors = groups.reduce(
		(sum, group) => sum + group.colors.length,
		0
	);
	if (totalColors === 0) {
		throw new PaletteParseError(
			"The file does not contain any recognizable ASE color."
		);
	}

	return {
		id: generateId(),
		name: baseNameFromPath(filePath),
		groups,
		sourceFormat: "ase",
		filePath,
	};
}

function utf16beByteLength(name: string): number {
	return (name.length + 1) * 2;
}

function writeName(view: DataView, offset: number, name: string): number {
	view.setUint16(offset, name.length + 1, false);
	let cursor = offset + 2;
	for (let i = 0; i < name.length; i++) {
		view.setUint16(cursor, name.charCodeAt(i), false);
		cursor += 2;
	}
	view.setUint16(cursor, 0, false);
	return cursor + 2;
}

function writeColorModel(
	view: DataView,
	offset: number,
	model: string
): number {
	for (let i = 0; i < 4; i++) {
		view.setUint8(offset + i, model.charCodeAt(i));
	}
	return offset + 4;
}

const BLOCK_HEADER_SIZE = 6; // blockType (2) + blockLength (4)
const NAME_LENGTH_FIELD_SIZE = 2;
const COLOR_ENTRY_FIXED_SIZE =
	BLOCK_HEADER_SIZE + NAME_LENGTH_FIELD_SIZE + 4 + 3 * 4 + 2; // + model tag, 3 RGB floats, colorType
const GROUP_END_SIZE = BLOCK_HEADER_SIZE; // empty body

function colorEntrySize(color: PaletteColor): number {
	return COLOR_ENTRY_FIXED_SIZE + utf16beByteLength(color.name ?? "");
}

function groupSize(group: PaletteGroup): number {
	const colorsSize = group.colors.reduce(
		(sum, color) => sum + colorEntrySize(color),
		0
	);
	if (!group.name) {
		return colorsSize;
	}
	const groupStartSize =
		BLOCK_HEADER_SIZE + NAME_LENGTH_FIELD_SIZE + utf16beByteLength(group.name);
	return groupStartSize + colorsSize + GROUP_END_SIZE;
}

function writeColorEntry(
	view: DataView,
	offset: number,
	color: PaletteColor
): number {
	const name = color.name ?? "";
	const bodyLength = 2 + utf16beByteLength(name) + 4 + 3 * 4 + 2;
	view.setUint16(offset, BLOCK_COLOR_ENTRY, false);
	view.setUint32(offset + 2, bodyLength, false);
	let cursor = writeName(view, offset + 6, name);
	cursor = writeColorModel(view, cursor, "RGB ");
	view.setFloat32(cursor, color.r / 255, false);
	view.setFloat32(cursor + 4, color.g / 255, false);
	view.setFloat32(cursor + 8, color.b / 255, false);
	cursor += 12;
	view.setUint16(cursor, 2, false); // colorType: Normal
	return cursor + 2;
}

export function serializeAse(palette: Palette): string {
	const bodySize = palette.groups.reduce(
		(sum, group) => sum + groupSize(group),
		0
	);
	const totalSize = 4 + 4 + 4 + bodySize;
	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);

	for (let i = 0; i < SIGNATURE.length; i++) {
		view.setUint8(i, SIGNATURE.charCodeAt(i));
	}
	view.setUint16(4, 1, false);
	view.setUint16(6, 0, false);

	let blockCount = 0;
	let offset = 12;
	for (const group of palette.groups) {
		if (group.name) {
			const bodyLength = NAME_LENGTH_FIELD_SIZE + utf16beByteLength(group.name);
			view.setUint16(offset, BLOCK_GROUP_START, false);
			view.setUint32(offset + 2, bodyLength, false);
			offset = writeName(view, offset + 6, group.name);
			blockCount++;
		}
		for (const color of group.colors) {
			offset = writeColorEntry(view, offset, color);
			blockCount++;
		}
		if (group.name) {
			view.setUint16(offset, BLOCK_GROUP_END, false);
			view.setUint32(offset + 2, 0, false);
			offset += 6;
			blockCount++;
		}
	}
	view.setUint32(8, blockCount, false);

	const bytes = new Uint8Array(buffer);
	const CHUNK_SIZE = 8192;
	let result = "";
	for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
		result += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
	}
	return result;
}
