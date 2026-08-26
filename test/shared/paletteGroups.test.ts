import {
	addColorToGroup,
	addColorsToGroup,
	addGroup,
	flattenGroups,
	insertColorsAroundIdInGroup,
	moveColorBetweenGroups,
	removeColorFromGroup,
	removeGroup,
	renameColorInGroup,
	renameGroup,
	reorderColorsInGroup,
	reorderGroups,
	updateColorInGroup,
	wrapAsSingleGroup,
} from "../../src/shared/paletteGroups";
import { PaletteColor, PaletteGroup } from "../../src/shared/types";

function color(
	id: string,
	overrides: Partial<PaletteColor> = {}
): PaletteColor {
	return { id, r: 0, g: 0, b: 0, hex: "#000000", ...overrides };
}

function group(
	id: string,
	colors: PaletteColor[],
	name?: string
): PaletteGroup {
	return { id, name, colors };
}

describe("flattenGroups", () => {
	it("concatenates every group colors in order", () => {
		const groups = [
			group("g1", [color("a"), color("b")]),
			group("g2", [color("c")]),
		];
		expect(flattenGroups(groups).map((c) => c.id)).toEqual(["a", "b", "c"]);
	});

	it("returns an empty array for no groups", () => {
		expect(flattenGroups([])).toEqual([]);
	});
});

describe("wrapAsSingleGroup", () => {
	it("wraps a flat list into a single group", () => {
		const colors = [color("a"), color("b")];
		const groups = wrapAsSingleGroup(colors);
		expect(groups).toHaveLength(1);
		expect(groups[0].colors).toEqual(colors);
	});
});

describe("addColorToGroup", () => {
	it("appends the color to the matching group only", () => {
		const groups = [group("g1", [color("a")]), group("g2", [])];
		const result = addColorToGroup(groups, "g2", {
			r: 1,
			g: 2,
			b: 3,
			hex: "#010203",
		});
		expect(result[0].colors).toHaveLength(1);
		expect(result[1].colors).toHaveLength(1);
		expect(result[1].colors[0]).toMatchObject({ r: 1, g: 2, b: 3 });
		expect(result[1].colors[0].id).toBeTruthy();
	});
});

describe("addColorsToGroup", () => {
	it("appends multiple colors, each with a generated id", () => {
		const groups = [group("g1", [])];
		const result = addColorsToGroup(groups, "g1", [
			{ r: 1, g: 1, b: 1, hex: "#010101" },
			{ r: 2, g: 2, b: 2, hex: "#020202" },
		]);
		expect(result[0].colors).toHaveLength(2);
		expect(new Set(result[0].colors.map((c) => c.id)).size).toBe(2);
	});
});

describe("insertColorsAroundIdInGroup", () => {
	it("inserts before/after colors around the anchor within the group", () => {
		const groups = [group("g1", [color("a"), color("anchor"), color("b")])];
		const result = insertColorsAroundIdInGroup(
			groups,
			"g1",
			"anchor",
			[{ r: 1, g: 0, b: 0, hex: "#010000" }],
			[{ r: 2, g: 0, b: 0, hex: "#020000" }]
		);
		const ids = result[0].colors.map((c) => c.r);
		expect(ids).toEqual([0, 1, 0, 2, 0]);
	});

	it("returns the group unchanged when the anchor is not found", () => {
		const groups = [group("g1", [color("a")])];
		const result = insertColorsAroundIdInGroup(groups, "g1", "missing", [], []);
		expect(result[0].colors).toHaveLength(1);
	});
});

describe("removeColorFromGroup", () => {
	it("removes only the targeted color from the targeted group", () => {
		const groups = [
			group("g1", [color("a"), color("b")]),
			group("g2", [color("a")]),
		];
		const result = removeColorFromGroup(groups, "g1", "a");
		expect(result[0].colors.map((c) => c.id)).toEqual(["b"]);
		expect(result[1].colors.map((c) => c.id)).toEqual(["a"]);
	});
});

describe("renameColorInGroup", () => {
	it("trims and sets the color name", () => {
		const groups = [group("g1", [color("a")])];
		const result = renameColorInGroup(groups, "g1", "a", "  New Name  ");
		expect(result[0].colors[0].name).toBe("New Name");
	});

	it("clears the name when given an empty/whitespace string", () => {
		const groups = [group("g1", [color("a", { name: "Old" })])];
		const result = renameColorInGroup(groups, "g1", "a", "   ");
		expect(result[0].colors[0].name).toBeUndefined();
	});
});

describe("updateColorInGroup", () => {
	it("merges the given changes into the matching color", () => {
		const groups = [group("g1", [color("a", { r: 1 })])];
		const result = updateColorInGroup(groups, "g1", "a", {
			r: 9,
			hex: "#090000",
		});
		expect(result[0].colors[0]).toMatchObject({ r: 9, hex: "#090000" });
	});
});

describe("reorderColorsInGroup", () => {
	it("reorders colors within the group according to the given id order", () => {
		const groups = [group("g1", [color("a"), color("b"), color("c")])];
		const result = reorderColorsInGroup(groups, "g1", ["c", "a", "b"]);
		expect(result[0].colors.map((c) => c.id)).toEqual(["c", "a", "b"]);
	});

	it("drops ids that no longer exist in the group", () => {
		const groups = [group("g1", [color("a"), color("b")])];
		const result = reorderColorsInGroup(groups, "g1", ["b", "missing", "a"]);
		expect(result[0].colors.map((c) => c.id)).toEqual(["b", "a"]);
	});
});

describe("moveColorBetweenGroups", () => {
	it("moves a color from one group to another at the target index", () => {
		const groups = [
			group("g1", [color("a"), color("b")]),
			group("g2", [color("c")]),
		];
		const result = moveColorBetweenGroups(groups, "a", "g1", "g2", 0);
		expect(result[0].colors.map((c) => c.id)).toEqual(["b"]);
		expect(result[1].colors.map((c) => c.id)).toEqual(["a", "c"]);
	});

	it("moves a color into an empty group", () => {
		const groups = [group("g1", [color("a")]), group("g2", [])];
		const result = moveColorBetweenGroups(groups, "a", "g1", "g2", 0);
		expect(result[0].colors).toHaveLength(0);
		expect(result[1].colors.map((c) => c.id)).toEqual(["a"]);
	});

	it("reorders within the same group when from and to are equal", () => {
		const groups = [group("g1", [color("a"), color("b"), color("c")])];
		const result = moveColorBetweenGroups(groups, "a", "g1", "g1", 2);
		expect(result[0].colors.map((c) => c.id)).toEqual(["b", "c", "a"]);
	});

	it("returns the groups unchanged if the color does not exist", () => {
		const groups = [group("g1", [color("a")])];
		const result = moveColorBetweenGroups(groups, "missing", "g1", "g1", 0);
		expect(result).toBe(groups);
	});
});

describe("addGroup", () => {
	it("appends a new empty group with a generated name when none is given", () => {
		const result = addGroup([]);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Group");
		expect(result[0].colors).toEqual([]);
	});

	it("numbers subsequent auto-named groups", () => {
		const first = addGroup([]);
		const second = addGroup(first);
		expect(second[1].name).toBe("Group 2");
	});

	it("uses the given trimmed name", () => {
		const result = addGroup([], "  Brand colors  ");
		expect(result[0].name).toBe("Brand colors");
	});
});

describe("renameGroup", () => {
	it("trims and sets the group name", () => {
		const groups = [group("g1", [], "Old")];
		const result = renameGroup(groups, "g1", "  New  ");
		expect(result[0].name).toBe("New");
	});

	it("clears the name when given an empty/whitespace string", () => {
		const groups = [group("g1", [], "Old")];
		const result = renameGroup(groups, "g1", "   ");
		expect(result[0].name).toBeUndefined();
	});
});

describe("removeGroup", () => {
	it("removes the targeted group and leaves the rest untouched", () => {
		const groups = [group("g1", []), group("g2", [])];
		const result = removeGroup(groups, "g1");
		expect(result.map((g) => g.id)).toEqual(["g2"]);
	});

	it("can remove the last remaining group, leaving zero groups", () => {
		const groups = [group("g1", [])];
		expect(removeGroup(groups, "g1")).toEqual([]);
	});
});

describe("reorderGroups", () => {
	it("reorders groups according to the given id order", () => {
		const groups = [group("g1", []), group("g2", []), group("g3", [])];
		const result = reorderGroups(groups, ["g3", "g1", "g2"]);
		expect(result.map((g) => g.id)).toEqual(["g3", "g1", "g2"]);
	});

	it("drops ids that no longer exist", () => {
		const groups = [group("g1", []), group("g2", [])];
		const result = reorderGroups(groups, ["g2", "missing"]);
		expect(result.map((g) => g.id)).toEqual(["g2"]);
	});
});
