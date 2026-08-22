import { create } from 'zustand';
import { ColorSystem, generateId } from '../../../shared/color';
import { Palette, PaletteColor } from '../../../shared/palette-formats';

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
  addColor: (paletteId: string, color: Omit<PaletteColor, 'id'>) => void;
  addColors: (paletteId: string, colors: Omit<PaletteColor, 'id'>[]) => void;
  insertColorsAroundId: (
    paletteId: string,
    anchorColorId: string,
    before: Omit<PaletteColor, 'id'>[],
    after: Omit<PaletteColor, 'id'>[]
  ) => void;
  removeColor: (paletteId: string, colorId: string) => void;
  renameColor: (paletteId: string, colorId: string, name: string) => void;
  updateColor: (paletteId: string, colorId: string, changes: Partial<Omit<PaletteColor, 'id'>>) => void;
  reorderColors: (paletteId: string, orderedColorIds: string[]) => void;
  undo: (paletteId: string) => void;
  redo: (paletteId: string) => void;
  getActivePalette: () => Palette | null;
}

type HistoryState = Pick<PaletteStoreState, 'palettes' | 'undoStacks' | 'redoStacks'>;

function insertPalette(
  state: Pick<PaletteStoreState, 'palettes' | 'tabOrder'>,
  palette: Palette
): Pick<PaletteStoreState, 'palettes' | 'tabOrder' | 'activeId'> {
  return {
    palettes: { ...state.palettes, [palette.id]: palette },
    tabOrder: [...state.tabOrder, palette.id],
    activeId: palette.id
  };
}

function nextUntitledName(palettes: Record<string, Palette>): string {
  const untitledCount = Object.values(palettes).filter((palette) => /^Untitled( \d+)?$/.test(palette.name)).length;
  return untitledCount === 0 ? 'Untitled' : `Untitled ${untitledCount + 1}`;
}

function withHistory(state: HistoryState, paletteId: string, mutate: (palette: Palette) => Palette): HistoryState {
  const palette = state.palettes[paletteId];
  if (!palette) return state;
  const updated = mutate(palette);
  if (updated === palette) return state;
  return {
    palettes: { ...state.palettes, [paletteId]: updated },
    undoStacks: { ...state.undoStacks, [paletteId]: [...(state.undoStacks[paletteId] ?? []), palette] },
    redoStacks: { ...state.redoStacks, [paletteId]: [] }
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
        colors: [],
        sourceFormat: 'gpl'
      };
      return insertPalette(state, palette);
    }),

  closeTab: (id) =>
    set((state) => {
      const { [id]: _removed, ...palettes } = state.palettes;
      const { [id]: _removedColorSystem, ...colorSystemByPalette } = state.colorSystemByPalette;
      const { [id]: _removedUndo, ...undoStacks } = state.undoStacks;
      const { [id]: _removedRedo, ...redoStacks } = state.redoStacks;
      const tabOrder = state.tabOrder.filter((tabId) => tabId !== id);
      const activeId = state.activeId === id ? tabOrder[tabOrder.length - 1] ?? null : state.activeId;
      return { palettes, colorSystemByPalette, undoStacks, redoStacks, tabOrder, activeId };
    }),

  setActive: (id) => set({ activeId: id }),

  setColorSystem: (paletteId, system) =>
    set((state) => ({
      colorSystemByPalette: { ...state.colorSystemByPalette, [paletteId]: system }
    })),

  renamePalette: (paletteId, name) =>
    set((state) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) return state;
      return withHistory(state, paletteId, (palette) => ({ ...palette, name: trimmed }));
    }),

  addColor: (paletteId, color) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => {
        const newColor: PaletteColor = { ...color, id: generateId() };
        return { ...palette, colors: [...palette.colors, newColor] };
      })
    ),

  addColors: (paletteId, colors) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => {
        const newColors: PaletteColor[] = colors.map((color) => ({ ...color, id: generateId() }));
        return { ...palette, colors: [...palette.colors, ...newColors] };
      })
    ),

  insertColorsAroundId: (paletteId, anchorColorId, before, after) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => {
        const anchorIndex = palette.colors.findIndex((color) => color.id === anchorColorId);
        if (anchorIndex === -1) return palette;
        const beforeColors: PaletteColor[] = before.map((color) => ({ ...color, id: generateId() }));
        const afterColors: PaletteColor[] = after.map((color) => ({ ...color, id: generateId() }));
        const colors = [
          ...palette.colors.slice(0, anchorIndex),
          ...beforeColors,
          palette.colors[anchorIndex],
          ...afterColors,
          ...palette.colors.slice(anchorIndex + 1)
        ];
        return { ...palette, colors };
      })
    ),

  removeColor: (paletteId, colorId) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => ({
        ...palette,
        colors: palette.colors.filter((color) => color.id !== colorId)
      }))
    ),

  renameColor: (paletteId, colorId, name) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => {
        const trimmed = name.trim();
        return {
          ...palette,
          colors: palette.colors.map((color) =>
            color.id === colorId ? { ...color, name: trimmed.length > 0 ? trimmed : undefined } : color
          )
        };
      })
    ),

  updateColor: (paletteId, colorId, changes) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => ({
        ...palette,
        colors: palette.colors.map((color) => (color.id === colorId ? { ...color, ...changes } : color))
      }))
    ),

  reorderColors: (paletteId, orderedColorIds) =>
    set((state) =>
      withHistory(state, paletteId, (palette) => {
        const byId = new Map(palette.colors.map((color) => [color.id, color]));
        const colors = orderedColorIds
          .map((id) => byId.get(id))
          .filter((color): color is PaletteColor => Boolean(color));
        return { ...palette, colors };
      })
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
        redoStacks: { ...state.redoStacks, [paletteId]: [...(state.redoStacks[paletteId] ?? []), current] }
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
        undoStacks: { ...state.undoStacks, [paletteId]: [...(state.undoStacks[paletteId] ?? []), current] }
      };
    }),

  getActivePalette: () => {
    const { activeId, palettes } = get();
    return activeId ? palettes[activeId] ?? null : null;
  }
}));
