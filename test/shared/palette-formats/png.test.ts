import { decode, encode } from "fast-png";
import {
	parsePng,
	serializePng,
} from "../../../src/shared/palette-formats/png";
import { Palette, PaletteParseError } from "../../../src/shared/types";

function toContent(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}

function buildPng(
	width: number,
	height: number,
	channels: number,
	data: number[]
): string {
	const encoded = encode({
		width,
		height,
		data: Uint8Array.from(data),
		depth: 8,
		channels,
	});
	return toContent(encoded);
}

describe("parsePng", () => {
	it("parses a 3x1 RGB strip into 3 distinct colors, in order", () => {
		const content = buildPng(3, 1, 3, [255, 0, 0, 0, 255, 0, 0, 0, 255]);
		const palette = parsePng(content, "test.png");
		expect(palette.sourceFormat).toBe("png");
		expect(palette.groups).toHaveLength(1);
		expect(
			palette.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))
		).toEqual([
			{ r: 255, g: 0, b: 0 },
			{ r: 0, g: 255, b: 0 },
			{ r: 0, g: 0, b: 255 },
		]);
	});

	it("dedupes repeated colors, keeping the first occurrence position", () => {
		const content = buildPng(3, 1, 3, [10, 20, 30, 40, 50, 60, 10, 20, 30]);
		const palette = parsePng(content, "test.png");
		expect(
			palette.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))
		).toEqual([
			{ r: 10, g: 20, b: 30 },
			{ r: 40, g: 50, b: 60 },
		]);
	});

	it("excludes fully-transparent pixels", () => {
		const content = buildPng(2, 1, 4, [255, 0, 0, 255, 0, 0, 0, 0]);
		const palette = parsePng(content, "test.png");
		expect(palette.groups[0].colors).toHaveLength(1);
		expect(palette.groups[0].colors[0]).toMatchObject({ r: 255, g: 0, b: 0 });
	});

	it("decodes a grayscale image to r === g === b", () => {
		const content = buildPng(1, 1, 1, [128]);
		const palette = parsePng(content, "test.png");
		expect(palette.groups[0].colors[0]).toMatchObject({
			r: 128,
			g: 128,
			b: 128,
		});
	});

	it("throws PaletteParseError for non-PNG content", () => {
		expect(() => parsePng("not a png", "test.png")).toThrow(PaletteParseError);
	});

	it("throws PaletteParseError when every pixel is fully transparent", () => {
		const content = buildPng(2, 1, 4, [0, 0, 0, 0, 0, 0, 0, 0]);
		expect(() => parsePng(content, "test.png")).toThrow(PaletteParseError);
	});
});

describe("serializePng", () => {
	it("round-trips a palette (default row shape) across groups, flattening into a single group", () => {
		const original: Palette = {
			id: "p1",
			name: "Test",
			sourceFormat: "png",
			groups: [
				{
					id: "g1",
					colors: [
						{ id: "c1", r: 10, g: 20, b: 30, hex: "#0a141e" },
						{ id: "c2", r: 200, g: 100, b: 50, hex: "#c86432" },
					],
				},
				{
					id: "g2",
					colors: [{ id: "c3", r: 5, g: 5, b: 5, hex: "#050505" }],
				},
			],
		};

		const roundTripped = parsePng(serializePng(original), "test.png");

		expect(roundTripped.groups).toHaveLength(1);
		expect(
			roundTripped.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))
		).toEqual([
			{ r: 10, g: 20, b: 30 },
			{ r: 200, g: 100, b: 50 },
			{ r: 5, g: 5, b: 5 },
		]);
	});

	it("produces a padded grid when columns does not evenly divide the color count, and drops padding on reimport", () => {
		const original: Palette = {
			id: "p1",
			name: "Test",
			sourceFormat: "png",
			groups: [
				{
					id: "g1",
					colors: [
						{ id: "c1", r: 1, g: 1, b: 1, hex: "#010101" },
						{ id: "c2", r: 2, g: 2, b: 2, hex: "#020202" },
						{ id: "c3", r: 3, g: 3, b: 3, hex: "#030303" },
						{ id: "c4", r: 4, g: 4, b: 4, hex: "#040404" },
						{ id: "c5", r: 5, g: 5, b: 5, hex: "#050505" },
					],
				},
			],
		};

		const content = serializePng(original, { columns: 2 });
		const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0) & 0xff);
		const decoded = decode(bytes);
		expect(decoded.width).toBe(2);
		expect(decoded.height).toBe(3);
		const lastCellAlphaOffset = 5 * decoded.channels + 3;
		expect(decoded.data[lastCellAlphaOffset]).toBe(0);

		const roundTripped = parsePng(content, "test.png");
		expect(
			roundTripped.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))
		).toEqual([
			{ r: 1, g: 1, b: 1 },
			{ r: 2, g: 2, b: 2 },
			{ r: 3, g: 3, b: 3 },
			{ r: 4, g: 4, b: 4 },
			{ r: 5, g: 5, b: 5 },
		]);
	});

	it("throws when exporting an empty palette", () => {
		const empty: Palette = {
			id: "p1",
			name: "Empty",
			sourceFormat: "png",
			groups: [],
		};
		expect(() => serializePng(empty)).toThrow();
	});
});
