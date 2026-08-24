import { generateId } from "./color";
import { PaletteColor, PaletteGroup } from "./types";

export function flattenGroups(groups: PaletteGroup[]): PaletteColor[] {
	return groups.flatMap((group) => group.colors);
}

export function wrapAsSingleGroup(colors: PaletteColor[]): PaletteGroup[] {
	return [{ id: generateId(), colors }];
}

function mapGroup(
	groups: PaletteGroup[],
	groupId: string,
	fn: (group: PaletteGroup) => PaletteGroup
): PaletteGroup[] {
	return groups.map((group) => (group.id === groupId ? fn(group) : group));
}

export function addColorToGroup(
	groups: PaletteGroup[],
	groupId: string,
	color: Omit<PaletteColor, "id">
): PaletteGroup[] {
	const newColor: PaletteColor = { ...color, id: generateId() };
	return mapGroup(groups, groupId, (group) => ({
		...group,
		colors: [...group.colors, newColor],
	}));
}

export function addColorsToGroup(
	groups: PaletteGroup[],
	groupId: string,
	colors: Omit<PaletteColor, "id">[]
): PaletteGroup[] {
	const newColors: PaletteColor[] = colors.map((color) => ({
		...color,
		id: generateId(),
	}));
	return mapGroup(groups, groupId, (group) => ({
		...group,
		colors: [...group.colors, ...newColors],
	}));
}

export function insertColorsAroundIdInGroup(
	groups: PaletteGroup[],
	groupId: string,
	anchorColorId: string,
	before: Omit<PaletteColor, "id">[],
	after: Omit<PaletteColor, "id">[]
): PaletteGroup[] {
	return mapGroup(groups, groupId, (group) => {
		const anchorIndex = group.colors.findIndex(
			(color) => color.id === anchorColorId
		);
		if (anchorIndex === -1) return group;
		const beforeColors: PaletteColor[] = before.map((color) => ({
			...color,
			id: generateId(),
		}));
		const afterColors: PaletteColor[] = after.map((color) => ({
			...color,
			id: generateId(),
		}));
		return {
			...group,
			colors: [
				...group.colors.slice(0, anchorIndex),
				...beforeColors,
				group.colors[anchorIndex],
				...afterColors,
				...group.colors.slice(anchorIndex + 1),
			],
		};
	});
}

export function removeColorFromGroup(
	groups: PaletteGroup[],
	groupId: string,
	colorId: string
): PaletteGroup[] {
	return mapGroup(groups, groupId, (group) => ({
		...group,
		colors: group.colors.filter((color) => color.id !== colorId),
	}));
}

export function renameColorInGroup(
	groups: PaletteGroup[],
	groupId: string,
	colorId: string,
	name: string
): PaletteGroup[] {
	const trimmed = name.trim();
	return mapGroup(groups, groupId, (group) => ({
		...group,
		colors: group.colors.map((color) =>
			color.id === colorId
				? { ...color, name: trimmed.length > 0 ? trimmed : undefined }
				: color
		),
	}));
}

export function updateColorInGroup(
	groups: PaletteGroup[],
	groupId: string,
	colorId: string,
	changes: Partial<Omit<PaletteColor, "id">>
): PaletteGroup[] {
	return mapGroup(groups, groupId, (group) => ({
		...group,
		colors: group.colors.map((color) =>
			color.id === colorId ? { ...color, ...changes } : color
		),
	}));
}

export function reorderColorsInGroup(
	groups: PaletteGroup[],
	groupId: string,
	orderedColorIds: string[]
): PaletteGroup[] {
	return mapGroup(groups, groupId, (group) => {
		const byId = new Map(group.colors.map((color) => [color.id, color]));
		const colors = orderedColorIds
			.map((id) => byId.get(id))
			.filter((color): color is PaletteColor => Boolean(color));
		return { ...group, colors };
	});
}

export function moveColorBetweenGroups(
	groups: PaletteGroup[],
	colorId: string,
	fromGroupId: string,
	toGroupId: string,
	targetIndex: number
): PaletteGroup[] {
	const fromGroup = groups.find((group) => group.id === fromGroupId);
	const color = fromGroup?.colors.find((c) => c.id === colorId);
	if (!fromGroup || !color) return groups;

	return groups.map((group) => {
		if (group.id === fromGroupId && group.id === toGroupId) {
			const withoutColor = group.colors.filter((c) => c.id !== colorId);
			const clampedIndex = Math.max(
				0,
				Math.min(targetIndex, withoutColor.length)
			);
			return {
				...group,
				colors: [
					...withoutColor.slice(0, clampedIndex),
					color,
					...withoutColor.slice(clampedIndex),
				],
			};
		}
		if (group.id === fromGroupId) {
			return { ...group, colors: group.colors.filter((c) => c.id !== colorId) };
		}
		if (group.id === toGroupId) {
			const clampedIndex = Math.max(
				0,
				Math.min(targetIndex, group.colors.length)
			);
			return {
				...group,
				colors: [
					...group.colors.slice(0, clampedIndex),
					color,
					...group.colors.slice(clampedIndex),
				],
			};
		}
		return group;
	});
}

function nextGroupName(groups: PaletteGroup[]): string {
	const untitledCount = groups.filter((group) =>
		group.name ? /^Group( \d+)?$/.test(group.name) : false
	).length;
	return untitledCount === 0 ? "Group" : `Group ${untitledCount + 1}`;
}

export function addGroup(
	groups: PaletteGroup[],
	name?: string
): PaletteGroup[] {
	const trimmed = name?.trim();
	const newGroup: PaletteGroup = {
		id: generateId(),
		name: trimmed && trimmed.length > 0 ? trimmed : nextGroupName(groups),
		colors: [],
	};
	return [...groups, newGroup];
}

export function renameGroup(
	groups: PaletteGroup[],
	groupId: string,
	name: string
): PaletteGroup[] {
	const trimmed = name.trim();
	return mapGroup(groups, groupId, (group) => ({
		...group,
		name: trimmed.length > 0 ? trimmed : undefined,
	}));
}

export function removeGroup(
	groups: PaletteGroup[],
	groupId: string
): PaletteGroup[] {
	return groups.filter((group) => group.id !== groupId);
}

export function reorderGroups(
	groups: PaletteGroup[],
	orderedGroupIds: string[]
): PaletteGroup[] {
	const byId = new Map(groups.map((group) => [group.id, group]));
	return orderedGroupIds
		.map((id) => byId.get(id))
		.filter((group): group is PaletteGroup => Boolean(group));
}
