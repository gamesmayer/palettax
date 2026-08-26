import {
	parseAco,
	serializeAco,
} from "../../../src/shared/palette-formats/aco";
import { labToRgb } from "../../../src/shared/color";
import { Palette, PaletteParseError } from "../../../src/shared/types";

function u16(value: number): number[] {
	return [(value >> 8) & 0xff, value & 0xff];
}

function i16(value: number): number[] {
	return u16(value & 0xffff);
}

function u32(value: number): number[] {
	return [
		(value >>> 24) & 0xff,
		(value >>> 16) & 0xff,
		(value >>> 8) & 0xff,
		value & 0xff,
	];
}

function nameBytes32(name: string): number[] {
	const bytes = [...u32(name.length + 1)];
	for (const ch of name) bytes.push(...u16(ch.charCodeAt(0)));
	bytes.push(...u16(0));
	return bytes;
}

function rawEntry(
	colorSpace: number,
	w1: number,
	w2: number,
	w3: number,
	w4: number
): number[] {
	return [
		...u16(colorSpace),
		...u16(w1 & 0xffff),
		...u16(w2 & 0xffff),
		...u16(w3 & 0xffff),
		...u16(w4 & 0xffff),
	];
}

function v1Entry(
	colorSpace: number,
	w1: number,
	w2: number,
	w3: number,
	w4: number
): number[] {
	return rawEntry(colorSpace, w1, w2, w3, w4);
}

function v2Entry(
	colorSpace: number,
	w1: number,
	w2: number,
	w3: number,
	w4: number,
	name: string
): number[] {
	return [...rawEntry(colorSpace, w1, w2, w3, w4), ...nameBytes32(name)];
}

function buildAcoV1(entries: number[][]): string {
	const bytes = [...u16(1), ...u16(entries.length), ...entries.flat()];
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
}

function buildAcoV2(entries: number[][]): string {
	const bytes = [...u16(2), ...u16(entries.length), ...entries.flat()];
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
}

function buildAcoV1PlusV2(
	v1Entries: number[][],
	v2Entries: number[][]
): string {
	const bytes = [
		...u16(1),
		...u16(v1Entries.length),
		...v1Entries.flat(),
		...u16(2),
		...u16(v2Entries.length),
		...v2Entries.flat(),
	];
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
}

function fromBytes(bytes: number[]): string {
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
}

describe("parseAco", () => {
	it("parses an RGB color from a version-1-only file (no names)", () => {
		const content = buildAcoV1([v1Entry(0, 65535, 0, 0, 0)]);
		const palette = parseAco(content, "test.aco");
		expect(palette.sourceFormat).toBe("aco");
		expect(palette.groups).toHaveLength(1);
		expect(palette.groups[0].colors).toEqual([
			expect.objectContaining({ r: 255, g: 0, b: 0, name: undefined }),
		]);
	});

	it("prefers version-2 names when a v1 block is followed by a v2 block, without duplicating colors", () => {
		const v1Entries = [v1Entry(0, 65535, 0, 0, 0), v1Entry(0, 0, 65535, 0, 0)];
		const v2Entries = [
			v2Entry(0, 65535, 0, 0, 0, "Alpha"),
			v2Entry(0, 0, 65535, 0, 0, "Beta"),
		];
		const content = buildAcoV1PlusV2(v1Entries, v2Entries);
		const palette = parseAco(content, "test.aco");
		const colors = palette.groups.flatMap((g) => g.colors);
		expect(colors).toHaveLength(2);
		expect(colors.map((c) => c.name)).toEqual(["Alpha", "Beta"]);
		expect(colors.map(({ r, g, b }) => ({ r, g, b }))).toEqual([
			{ r: 255, g: 0, b: 0 },
			{ r: 0, g: 255, b: 0 },
		]);
	});

	it("parses a version-2-only file", () => {
		const content = buildAcoV2([v2Entry(0, 0, 0, 65535, 0, "Solo")]);
		const palette = parseAco(content, "test.aco");
		const colors = palette.groups.flatMap((g) => g.colors);
		expect(colors).toHaveLength(1);
		expect(colors[0]).toMatchObject({ r: 0, g: 0, b: 255, name: "Solo" });
	});

	it("converts an HSB color entry", () => {
		const content = buildAcoV1([v1Entry(1, 21845, 65535, 65535, 0)]);
		const palette = parseAco(content, "test.aco");
		expect(palette.groups[0].colors[0]).toMatchObject({ r: 0, g: 255, b: 0 });
	});

	it("converts an inverted CMYK color entry", () => {
		const content = buildAcoV1([v1Entry(2, 65535, 0, 0, 65535)]);
		const palette = parseAco(content, "test.aco");
		expect(palette.groups[0].colors[0]).toMatchObject({ r: 255, g: 0, b: 0 });
	});

	it("approximates an RGB color from a Lab color entry", () => {
		const content = buildAcoV1([v1Entry(7, 5324, 8009, 6720, 0)]);
		const palette = parseAco(content, "test.aco");
		const { r, g, b } = palette.groups[0].colors[0];
		expect(r).toBeGreaterThanOrEqual(250);
		expect(g).toBeLessThanOrEqual(5);
		expect(b).toBeLessThanOrEqual(5);
	});

	it("decodes negative Lab a/b components as signed 16-bit values", () => {
		const entryBytes = [
			...u16(7),
			...u16(5000),
			...i16(-5000),
			...i16(-5000),
			...u16(0),
		];
		const content = buildAcoV1([entryBytes]);
		const palette = parseAco(content, "test.aco");
		const expected = labToRgb(50, -50, -50);
		expect(palette.groups[0].colors[0]).toMatchObject(expected);
	});

	it("converts a Grayscale color entry", () => {
		const content = buildAcoV1([v1Entry(8, 5000, 0, 0, 0)]);
		const palette = parseAco(content, "test.aco");
		expect(palette.groups[0].colors[0]).toMatchObject({
			r: 128,
			g: 128,
			b: 128,
		});
	});

	it("skips entries with an unrecognized color space without corrupting later offsets", () => {
		const content = buildAcoV2([
			v2Entry(3, 0, 0, 0, 0, "Bad"),
			v2Entry(0, 65535, 0, 0, 0, "Good"),
		]);
		const palette = parseAco(content, "test.aco");
		const colors = palette.groups.flatMap((g) => g.colors);
		expect(colors).toHaveLength(1);
		expect(colors[0]).toMatchObject({ r: 255, g: 0, b: 0, name: "Good" });
	});

	it("throws PaletteParseError for a buffer shorter than the minimum header", () => {
		expect(() => parseAco(fromBytes([0, 1]), "test.aco")).toThrow(
			PaletteParseError
		);
	});

	it("throws PaletteParseError for an unrecognized version number", () => {
		const content = fromBytes([...u16(99), ...u16(0)]);
		expect(() => parseAco(content, "test.aco")).toThrow(PaletteParseError);
	});

	it("throws PaletteParseError when the buffer is truncated mid-entry", () => {
		const content = fromBytes([...u16(1), ...u16(1), ...u16(0), ...u16(0)]);
		expect(() => parseAco(content, "test.aco")).toThrow(PaletteParseError);
	});

	it("throws PaletteParseError for a well-formed file with zero colors", () => {
		const content = buildAcoV1([]);
		expect(() => parseAco(content, "test.aco")).toThrow(PaletteParseError);
	});
});

describe("serializeAco", () => {
	it("round-trips a palette across groups, flattening into a single group", () => {
		const original: Palette = {
			id: "p1",
			name: "Test",
			sourceFormat: "aco",
			groups: [
				{
					id: "g1",
					name: "Brand",
					colors: [
						{ id: "c1", r: 0, g: 1, b: 254, hex: "#0001fe", name: "Odd" },
						{ id: "c2", r: 255, g: 255, b: 255, hex: "#ffffff" },
					],
				},
				{
					id: "g2",
					colors: [
						{ id: "c3", r: 128, g: 64, b: 32, hex: "#804020", name: "Brown" },
					],
				},
			],
		};

		const roundTripped = parseAco(serializeAco(original), "test.aco");

		expect(roundTripped.groups).toHaveLength(1);
		expect(
			roundTripped.groups[0].colors.map(({ r, g, b, name }) => ({
				r,
				g,
				b,
				name,
			}))
		).toEqual([
			{ r: 0, g: 1, b: 254, name: "Odd" },
			{ r: 255, g: 255, b: 255, name: undefined },
			{ r: 128, g: 64, b: 32, name: "Brown" },
		]);
	});
});
