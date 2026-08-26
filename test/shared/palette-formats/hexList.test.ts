import {
	parseHexTxt,
	serializeHexTxt,
} from "../../../src/shared/palette-formats/hexList";
import { PaletteParseError } from "../../../src/shared/types";

const VALID_TXT = ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF"].join("\n");

describe("parseHexTxt", () => {
	it("parses a list of hex colors, one per line", () => {
		const palette = parseHexTxt(VALID_TXT, "/tmp/MyPalette.txt");
		expect(palette.name).toBe("MyPalette");
		expect(palette.sourceFormat).toBe("txt");
		expect(palette.groups).toHaveLength(1);
		expect(palette.groups[0].colors).toHaveLength(4);
		expect(palette.groups[0].colors[0]).toMatchObject({
			r: 255,
			g: 0,
			b: 0,
			hex: "#FF0000",
		});
		expect(palette.groups[0].colors[3]).toMatchObject({
			r: 255,
			g: 255,
			b: 255,
			hex: "#FFFFFF",
		});
		expect(
			palette.groups[0].colors.every((color) => color.name === undefined)
		).toBe(true);
	});

	it("is tolerant and discards lines that are not a valid hex color", () => {
		const content = ["#FF0000", "this is not a color", "#00FF00"].join("\n");
		const palette = parseHexTxt(content, "test.txt");
		expect(palette.groups[0].colors).toHaveLength(2);
	});

	it("is case-insensitive and normalizes the output", () => {
		const palette = parseHexTxt("#ff0000", "test.txt");
		expect(palette.groups[0].colors[0].hex).toBe("#FF0000");
	});

	it("throws PaletteParseError if there is no valid color", () => {
		expect(() => parseHexTxt("this is not a color", "test.txt")).toThrow(
			PaletteParseError
		);
	});
});

describe("serializeHexTxt", () => {
	it("serializes only the hex value, discarding any name", () => {
		const palette = parseHexTxt(VALID_TXT, "test.txt");
		const serialized = serializeHexTxt({
			...palette,
			groups: [
				{
					...palette.groups[0],
					colors: palette.groups[0].colors.map((color) => ({
						...color,
						name: "Ignored",
					})),
				},
			],
		});
		expect(serialized).not.toContain("Ignored");
		expect(serialized.trim().split("\n")).toEqual([
			"#FF0000",
			"#00FF00",
			"#0000FF",
			"#FFFFFF",
		]);
	});

	it("round-trips keeping the same colors and order", () => {
		const original = parseHexTxt(VALID_TXT, "test.txt");
		const roundTripped = parseHexTxt(serializeHexTxt(original), "test.txt");
		expect(
			roundTripped.groups[0].colors.map(({ r, g, b }) => ({ r, g, b }))
		).toEqual(original.groups[0].colors.map(({ r, g, b }) => ({ r, g, b })));
	});
});
