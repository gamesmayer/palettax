import { convertIndexedToRgb, decode, encode } from "fast-png";
import { generateId, rgbToHex } from "../color";
import { flattenGroups, wrapAsSingleGroup } from "../paletteGroups";
import { Palette, PaletteColor, PaletteParseError } from "../types";

function baseNameFromPath(filePath: string): string {
	const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
	return fileName.replace(/\.[^.]+$/, "");
}

export function parsePng(content: string, filePath: string): Palette {
	const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0) & 0xff);

	let decoded: ReturnType<typeof decode>;
	try {
		decoded = decode(bytes);
	} catch {
		throw new PaletteParseError("The file is not a valid PNG image.");
	}

	const { width, height } = decoded;
	let data = decoded.data;
	let channels = decoded.channels;
	let depth = decoded.depth;

	if (decoded.palette) {
		data = convertIndexedToRgb(decoded);
		channels = decoded.palette[0]?.length ?? 3;
		depth = 8;
	}

	const maxValue = 2 ** depth - 1;
	const scale = (value: number): number => Math.round((value / maxValue) * 255);

	const colors = new Map<string, PaletteColor>();
	const pixelCount = width * height;
	for (let i = 0; i < pixelCount; i++) {
		const offset = i * channels;
		let r: number;
		let g: number;
		let b: number;
		let alpha = 255;

		if (channels === 1) {
			r = g = b = scale(data[offset]);
		} else if (channels === 2) {
			r = g = b = scale(data[offset]);
			alpha = scale(data[offset + 1]);
		} else if (channels === 3) {
			r = scale(data[offset]);
			g = scale(data[offset + 1]);
			b = scale(data[offset + 2]);
		} else {
			r = scale(data[offset]);
			g = scale(data[offset + 1]);
			b = scale(data[offset + 2]);
			alpha = scale(data[offset + 3]);
		}

		if (alpha === 0) continue;

		const key = `${r},${g},${b}`;
		if (!colors.has(key)) {
			colors.set(key, { id: generateId(), r, g, b, hex: rgbToHex(r, g, b) });
		}
	}

	if (colors.size === 0) {
		throw new PaletteParseError(
			"The PNG image does not contain any visible colors."
		);
	}

	return {
		id: generateId(),
		name: baseNameFromPath(filePath),
		groups: wrapAsSingleGroup([...colors.values()]),
		sourceFormat: "png",
		filePath,
	};
}

export interface PngExportOptions {
	columns: number;
}

export function serializePng(
	palette: Palette,
	options?: PngExportOptions
): string {
	const colors = flattenGroups(palette.groups);
	if (colors.length === 0) {
		throw new Error("Cannot export an empty palette as a PNG image.");
	}

	const columns = Math.max(1, Math.round(options?.columns ?? colors.length));
	const rows = Math.ceil(colors.length / columns);
	const totalCells = columns * rows;

	const data = new Uint8Array(totalCells * 4);
	for (let i = 0; i < totalCells; i++) {
		const color = colors[i];
		if (!color) continue;
		const offset = i * 4;
		data[offset] = color.r;
		data[offset + 1] = color.g;
		data[offset + 2] = color.b;
		data[offset + 3] = 255;
	}

	const encoded = encode({
		width: columns,
		height: rows,
		data,
		depth: 8,
		channels: 4,
	});

	const CHUNK_SIZE = 8192;
	let result = "";
	for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
		result += String.fromCharCode(...encoded.subarray(i, i + CHUNK_SIZE));
	}
	return result;
}
