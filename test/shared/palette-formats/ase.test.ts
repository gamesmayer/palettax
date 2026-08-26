import {
	parseAse,
	serializeAse,
} from "../../../src/shared/palette-formats/ase";
import { Palette, PaletteParseError } from "../../../src/shared/types";

function u16(value: number): number[] {
	return [(value >> 8) & 0xff, value & 0xff];
}

function u32(value: number): number[] {
	return [
		(value >>> 24) & 0xff,
		(value >>> 16) & 0xff,
		(value >>> 8) & 0xff,
		value & 0xff,
	];
}

function f32(value: number): number[] {
	const buffer = new ArrayBuffer(4);
	new DataView(buffer).setFloat32(0, value, false);
	return Array.from(new Uint8Array(buffer));
}

function nameBytes(name: string): number[] {
	const bytes = [...u16(name.length + 1)];
	for (const ch of name) bytes.push(...u16(ch.charCodeAt(0)));
	bytes.push(...u16(0));
	return bytes;
}

function block(type: number, body: number[]): number[] {
	return [...u16(type), ...u32(body.length), ...body];
}

function colorEntryBlock(
	name: string,
	model: string,
	components: number[]
): number[] {
	const body = [
		...nameBytes(name),
		...Array.from(model).map((ch) => ch.charCodeAt(0)),
		...components.flatMap((value) => f32(value)),
		...u16(2),
	];
	return block(0x0001, body);
}

function groupStartBlock(name: string): number[] {
	return block(0xc001, nameBytes(name));
}

function groupEndBlock(): number[] {
	return block(0xc002, []);
}

function buildAse(blocks: number[][]): string {
	const bytes = [
		..."ASEF".split("").map((ch) => ch.charCodeAt(0)),
		...u16(1),
		...u16(0),
		...u32(blocks.length),
		...blocks.flat(),
	];
	return bytes.map((byte) => String.fromCharCode(byte)).join("");
}

describe("parseAse", () => {
	it("parses an RGB color entry", () => {
		const content = buildAse([colorEntryBlock("Red", "RGB ", [1, 0, 0])]);
		const palette = parseAse(content, "test.ase");
		expect(palette.sourceFormat).toBe("ase");
		expect(palette.groups).toHaveLength(1);
		expect(palette.groups[0].colors[0]).toMatchObject({
			r: 255,
			g: 0,
			b: 0,
			name: "Red",
		});
	});

	it("parses a Gray color entry", () => {
		const content = buildAse([colorEntryBlock("", "Gray", [0.5])]);
		const palette = parseAse(content, "test.ase");
		expect(palette.groups[0].colors[0]).toMatchObject({
			r: 128,
			g: 128,
			b: 128,
		});
	});

	it("parses a CMYK color entry", () => {
		const content = buildAse([colorEntryBlock("", "CMYK", [0, 1, 1, 0])]);
		const palette = parseAse(content, "test.ase");
		expect(palette.groups[0].colors[0]).toMatchObject({ r: 255, g: 0, b: 0 });
	});

	it("approximates an RGB color from a Lab color entry", () => {
		const content = buildAse([
			colorEntryBlock("", "LAB ", [53.24, 80.09, 67.2]),
		]);
		const palette = parseAse(content, "test.ase");
		const { r, g, b } = palette.groups[0].colors[0];
		expect(r).toBeGreaterThanOrEqual(250);
		expect(g).toBeLessThanOrEqual(5);
		expect(b).toBeLessThanOrEqual(5);
	});

	it("groups colors wrapped in a group start/end pair under a named group", () => {
		const content = buildAse([
			groupStartBlock("Brand"),
			colorEntryBlock("A", "RGB ", [1, 0, 0]),
			colorEntryBlock("B", "RGB ", [0, 1, 0]),
			groupEndBlock(),
		]);
		const palette = parseAse(content, "test.ase");
		expect(palette.groups).toHaveLength(1);
		expect(palette.groups[0].name).toBe("Brand");
		expect(palette.groups[0].colors).toHaveLength(2);
	});

	it("buckets top-level colors outside any group into ungrouped groups, preserving order", () => {
		const content = buildAse([
			colorEntryBlock("Top", "RGB ", [1, 1, 1]),
			groupStartBlock("Brand"),
			colorEntryBlock("A", "RGB ", [1, 0, 0]),
			groupEndBlock(),
			colorEntryBlock("AlsoTop", "RGB ", [0, 0, 0]),
		]);
		const palette = parseAse(content, "test.ase");
		expect(palette.groups).toHaveLength(3);
		expect(palette.groups[0].name).toBeUndefined();
		expect(palette.groups[0].colors.map((c) => c.name)).toEqual(["Top"]);
		expect(palette.groups[1].name).toBe("Brand");
		expect(palette.groups[1].colors.map((c) => c.name)).toEqual(["A"]);
		expect(palette.groups[2].name).toBeUndefined();
		expect(palette.groups[2].colors.map((c) => c.name)).toEqual(["AlsoTop"]);
	});

	it("skips color entries with an unrecognized color model", () => {
		const content = buildAse([
			colorEntryBlock("Bad", "XYZ ", [0, 0, 0]),
			colorEntryBlock("Good", "RGB ", [1, 0, 0]),
		]);
		const palette = parseAse(content, "test.ase");
		const colors = palette.groups.flatMap((g) => g.colors);
		expect(colors).toHaveLength(1);
		expect(colors[0].name).toBe("Good");
	});

	it("throws PaletteParseError for a bad signature", () => {
		expect(() => parseAse("NOTASEF", "test.ase")).toThrow(PaletteParseError);
	});

	it("throws PaletteParseError when there are no recognizable colors", () => {
		const content = buildAse([]);
		expect(() => parseAse(content, "test.ase")).toThrow(PaletteParseError);
	});
});

describe("serializeAse", () => {
	it("round-trips a palette with a named group and an ungrouped color", () => {
		const original: Palette = {
			id: "p1",
			name: "Test",
			sourceFormat: "ase",
			groups: [
				{
					id: "g1",
					name: "Brand",
					colors: [
						{ id: "c1", r: 200, g: 10, b: 5, hex: "#c80a05", name: "Brick" },
						{ id: "c2", r: 0, g: 128, b: 255, hex: "#0080ff" },
					],
				},
				{
					id: "g2",
					colors: [
						{ id: "c3", r: 1, g: 254, b: 127, hex: "#01fe7f", name: "Odd" },
					],
				},
			],
		};

		const roundTripped = parseAse(serializeAse(original), "test.ase");

		expect(roundTripped.groups).toHaveLength(2);
		expect(roundTripped.groups[0].name).toBe("Brand");
		expect(
			roundTripped.groups[0].colors.map(({ r, g, b, name }) => ({
				r,
				g,
				b,
				name,
			}))
		).toEqual([
			{ r: 200, g: 10, b: 5, name: "Brick" },
			{ r: 0, g: 128, b: 255, name: undefined },
		]);
		expect(roundTripped.groups[1].name).toBeUndefined();
		expect(
			roundTripped.groups[1].colors.map(({ r, g, b, name }) => ({
				r,
				g,
				b,
				name,
			}))
		).toEqual([{ r: 1, g: 254, b: 127, name: "Odd" }]);
	});
});
