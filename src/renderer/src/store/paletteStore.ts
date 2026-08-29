import { create } from "zustand";
import { ColorSystem, generateId } from "../../../shared/color";
import {
	addColorToGroup,
	addColorsToGroup,
	addGroup as addGroupToPalette,
	insertColorsAroundIdInGroup,
	moveColorBetweenGroups,
	removeColorFromGroup,
	removeGroup as removeGroupFromPalette,
	renameColorInGroup,
	renameGroup as renameGroupInPalette,
	reorderColorsInGroup,
	reorderGroups as reorderGroupsInPalette,
	updateColorInGroup,
} from "../../../shared/paletteGroups";
import { Palette, PaletteColor } from "../../../shared/palette-formats";

interface PaletteStoreState {
	palettes: Record<string, Palette>;
	tabOrder: string[];
	activeId: string | null;
	colorSystemByPalette: Record<string, ColorSystem>;
	undoStacks: Record<string, Palette[]>;
	redoStacks: Record<string, Palette[]>;

	addPalette: (palette: Palette) => void;
	createPalette: () => void;
	closeTab: (id: string) => void;
	setActive: (id: string) => void;
	setColorSystem: (paletteId: string, system: ColorSystem) => void;
	renamePalette: (paletteId: string, name: string) => void;
	addColor: (
		paletteId: string,
		groupId: string,
		color: Omit<PaletteColor, "id">
	) => void;
	addColors: (
		paletteId: string,
		groupId: string,
		colors: Omit<PaletteColor, "id">[]
	) => void;
	insertColorsAroundId: (
		paletteId: string,
		groupId: string,
		anchorColorId: string,
		before: Omit<PaletteColor, "id">[],
		after: Omit<PaletteColor, "id">[]
	) => void;
	removeColor: (paletteId: string, groupId: string, colorId: string) => void;
	renameColor: (
		paletteId: string,
		groupId: string,
		colorId: string,
		name: string
	) => void;
	updateColor: (
		paletteId: string,
		groupId: string,
		colorId: string,
		changes: Partial<Omit<PaletteColor, "id">>
	) => void;
	reorderColors: (
		paletteId: string,
		groupId: string,
		orderedColorIds: string[]
	) => void;
	moveColor: (
		paletteId: string,
		colorId: string,
		fromGroupId: string,
		toGroupId: string,
		targetIndex: number
	) => void;
	addGroup: (paletteId: string, name?: string) => string;
	renameGroup: (paletteId: string, groupId: string, name: string) => void;
	removeGroup: (paletteId: string, groupId: string) => void;
	reorderGroups: (paletteId: string, orderedGroupIds: string[]) => void;
	undo: (paletteId: string) => void;
	redo: (paletteId: string) => void;
	getActivePalette: () => Palette | null;
}

type HistoryState = Pick<
	PaletteStoreState,
	"palettes" | "undoStacks" | "redoStacks"
>;

function insertPalette(
	state: Pick<PaletteStoreState, "palettes" | "tabOrder">,
	palette: Palette
): Pick<PaletteStoreState, "palettes" | "tabOrder" | "activeId"> {
	return {
		palettes: { ...state.palettes, [palette.id]: palette },
		tabOrder: [...state.tabOrder, palette.id],
		activeId: palette.id,
	};
}

const UNTITLED_PATTERN = /^Untitled(?: (\d+))?$/;

function nextUntitledName(palettes: Record<string, Palette>): string {
	const untitledCount = Object.values(palettes).filter((palette) =>
		UNTITLED_PATTERN.test(palette.name)
	).length;
	return untitledCount === 0 ? "Untitled" : `Untitled ${untitledCount + 1}`;
}

/**
 * `Palette.name` stores the untitled marker in English (matched by
 * `UNTITLED_PATTERN` above and used as a filename default), independent of
 * the UI language — this formats it for display only.
 */
export function formatPaletteName(
	name: string,
	translateUntitled: () => string
): string {
	const match = UNTITLED_PATTERN.exec(name);
	if (!match) return name;
	const base = translateUntitled();
	return match[1] ? `${base} ${match[1]}` : base;
}

function withHistory(
	state: HistoryState,
	paletteId: string,
	mutate: (palette: Palette) => Palette
): HistoryState {
	const palette = state.palettes[paletteId];
	if (!palette) return state;
	const updated = mutate(palette);
	if (updated === palette) return state;
	return {
		palettes: { ...state.palettes, [paletteId]: updated },
		undoStacks: {
			...state.undoStacks,
			[paletteId]: [...(state.undoStacks[paletteId] ?? []), palette],
		},
		redoStacks: { ...state.redoStacks, [paletteId]: [] },
	};
}

export const usePaletteStore = create<PaletteStoreState>((set, get) => ({
	palettes: {},
	tabOrder: [],
	activeId: null,
	colorSystemByPalette: {},
	undoStacks: {},
	redoStacks: {},

	addPalette: (palette) => set((state) => insertPalette(state, palette)),

	createPalette: () =>
		set((state) => {
			const palette: Palette = {
				id: generateId(),
				name: nextUntitledName(state.palettes),
				groups: [{ id: generateId(), colors: [] }],
				sourceFormat: "gpl",
			};
			return insertPalette(state, palette);
		}),

	closeTab: (id) =>
		set((state) => {
			const { [id]: _removed, ...palettes } = state.palettes;
			const { [id]: _removedColorSystem, ...colorSystemByPalette } =
				state.colorSystemByPalette;
			const { [id]: _removedUndo, ...undoStacks } = state.undoStacks;
			const { [id]: _removedRedo, ...redoStacks } = state.redoStacks;
			const tabOrder = state.tabOrder.filter((tabId) => tabId !== id);
			const activeId =
				state.activeId === id
					? (tabOrder[tabOrder.length - 1] ?? null)
					: state.activeId;
			return {
				palettes,
				colorSystemByPalette,
				undoStacks,
				redoStacks,
				tabOrder,
				activeId,
			};
		}),

	setActive: (id) => set({ activeId: id }),

	setColorSystem: (paletteId, system) =>
		set((state) => ({
			colorSystemByPalette: {
				...state.colorSystemByPalette,
				[paletteId]: system,
			},
		})),

	renamePalette: (paletteId, name) =>
		set((state) => {
			const trimmed = name.trim();
			if (trimmed.length === 0) return state;
			return withHistory(state, paletteId, (palette) => ({
				...palette,
				name: trimmed,
			}));
		}),

	addColor: (paletteId, groupId, color) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: addColorToGroup(palette.groups, groupId, color),
			}))
		),

	addColors: (paletteId, groupId, colors) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: addColorsToGroup(palette.groups, groupId, colors),
			}))
		),

	insertColorsAroundId: (paletteId, groupId, anchorColorId, before, after) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: insertColorsAroundIdInGroup(
					palette.groups,
					groupId,
					anchorColorId,
					before,
					after
				),
			}))
		),

	removeColor: (paletteId, groupId, colorId) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: removeColorFromGroup(palette.groups, groupId, colorId),
			}))
		),

	renameColor: (paletteId, groupId, colorId, name) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: renameColorInGroup(palette.groups, groupId, colorId, name),
			}))
		),

	updateColor: (paletteId, groupId, colorId, changes) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: updateColorInGroup(palette.groups, groupId, colorId, changes),
			}))
		),

	reorderColors: (paletteId, groupId, orderedColorIds) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: reorderColorsInGroup(palette.groups, groupId, orderedColorIds),
			}))
		),

	moveColor: (paletteId, colorId, fromGroupId, toGroupId, targetIndex) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: moveColorBetweenGroups(
					palette.groups,
					colorId,
					fromGroupId,
					toGroupId,
					targetIndex
				),
			}))
		),

	addGroup: (paletteId, name) => {
		let newGroupId = "";
		set((state) =>
			withHistory(state, paletteId, (palette) => {
				const groups = addGroupToPalette(palette.groups, name);
				newGroupId = groups[groups.length - 1].id;
				return { ...palette, groups };
			})
		);
		return newGroupId;
	},

	renameGroup: (paletteId, groupId, name) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: renameGroupInPalette(palette.groups, groupId, name),
			}))
		),

	removeGroup: (paletteId, groupId) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: removeGroupFromPalette(palette.groups, groupId),
			}))
		),

	reorderGroups: (paletteId, orderedGroupIds) =>
		set((state) =>
			withHistory(state, paletteId, (palette) => ({
				...palette,
				groups: reorderGroupsInPalette(palette.groups, orderedGroupIds),
			}))
		),

	undo: (paletteId) =>
		set((state) => {
			const stack = state.undoStacks[paletteId];
			const current = state.palettes[paletteId];
			if (!stack || stack.length === 0 || !current) return state;
			const previous = stack[stack.length - 1];
			return {
				palettes: { ...state.palettes, [paletteId]: previous },
				undoStacks: { ...state.undoStacks, [paletteId]: stack.slice(0, -1) },
				redoStacks: {
					...state.redoStacks,
					[paletteId]: [...(state.redoStacks[paletteId] ?? []), current],
				},
			};
		}),

	redo: (paletteId) =>
		set((state) => {
			const stack = state.redoStacks[paletteId];
			const current = state.palettes[paletteId];
			if (!stack || stack.length === 0 || !current) return state;
			const next = stack[stack.length - 1];
			return {
				palettes: { ...state.palettes, [paletteId]: next },
				redoStacks: { ...state.redoStacks, [paletteId]: stack.slice(0, -1) },
				undoStacks: {
					...state.undoStacks,
					[paletteId]: [...(state.undoStacks[paletteId] ?? []), current],
				},
			};
		}),

	getActivePalette: () => {
		const { activeId, palettes } = get();
		return activeId ? (palettes[activeId] ?? null) : null;
	},
}));
