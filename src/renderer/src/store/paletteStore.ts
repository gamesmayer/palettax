import { create } from 'zustand';
import { ColorSystem, generateId } from '../../../shared/color';
import { Palette, PaletteColor } from '../../../shared/palette-formats';

interface PaletteStoreState {
  palettes: Record<string, Palette>;
  tabOrder: string[];
  activeId: string | null;
  colorSystemByPalette: Record<string, ColorSystem>;

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
  getActivePalette: () => Palette | null;
}

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

export const usePaletteStore = create<PaletteStoreState>((set, get) => ({
  palettes: {},
  tabOrder: [],
  activeId: null,
  colorSystemByPalette: {},

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
      const tabOrder = state.tabOrder.filter((tabId) => tabId !== id);
      const activeId = state.activeId === id ? tabOrder[tabOrder.length - 1] ?? null : state.activeId;
      return { palettes, colorSystemByPalette, tabOrder, activeId };
    }),

  setActive: (id) => set({ activeId: id }),

  setColorSystem: (paletteId, system) =>
    set((state) => ({
      colorSystemByPalette: { ...state.colorSystemByPalette, [paletteId]: system }
    })),

  renamePalette: (paletteId, name) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      const trimmed = name.trim();
      if (!palette || trimmed.length === 0) return state;
      return { palettes: { ...state.palettes, [paletteId]: { ...palette, name: trimmed } } };
    }),

  addColor: (paletteId, color) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      const newColor: PaletteColor = { ...color, id: generateId() };
      return {
        palettes: {
          ...state.palettes,
          [paletteId]: { ...palette, colors: [...palette.colors, newColor] }
        }
      };
    }),

  addColors: (paletteId, colors) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      const newColors: PaletteColor[] = colors.map((color) => ({ ...color, id: generateId() }));
      return {
        palettes: {
          ...state.palettes,
          [paletteId]: { ...palette, colors: [...palette.colors, ...newColors] }
        }
      };
    }),

  insertColorsAroundId: (paletteId, anchorColorId, before, after) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      const anchorIndex = palette.colors.findIndex((color) => color.id === anchorColorId);
      if (anchorIndex === -1) return state;
      const beforeColors: PaletteColor[] = before.map((color) => ({ ...color, id: generateId() }));
      const afterColors: PaletteColor[] = after.map((color) => ({ ...color, id: generateId() }));
      const colors = [
        ...palette.colors.slice(0, anchorIndex),
        ...beforeColors,
        palette.colors[anchorIndex],
        ...afterColors,
        ...palette.colors.slice(anchorIndex + 1)
      ];
      return { palettes: { ...state.palettes, [paletteId]: { ...palette, colors } } };
    }),

  removeColor: (paletteId, colorId) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      return {
        palettes: {
          ...state.palettes,
          [paletteId]: { ...palette, colors: palette.colors.filter((color) => color.id !== colorId) }
        }
      };
    }),

  renameColor: (paletteId, colorId, name) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      const trimmed = name.trim();
      return {
        palettes: {
          ...state.palettes,
          [paletteId]: {
            ...palette,
            colors: palette.colors.map((color) =>
              color.id === colorId ? { ...color, name: trimmed.length > 0 ? trimmed : undefined } : color
            )
          }
        }
      };
    }),

  updateColor: (paletteId, colorId, changes) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      return {
        palettes: {
          ...state.palettes,
          [paletteId]: {
            ...palette,
            colors: palette.colors.map((color) => (color.id === colorId ? { ...color, ...changes } : color))
          }
        }
      };
    }),

  reorderColors: (paletteId, orderedColorIds) =>
    set((state) => {
      const palette = state.palettes[paletteId];
      if (!palette) return state;
      const byId = new Map(palette.colors.map((color) => [color.id, color]));
      const colors = orderedColorIds
        .map((id) => byId.get(id))
        .filter((color): color is PaletteColor => Boolean(color));
      return { palettes: { ...state.palettes, [paletteId]: { ...palette, colors } } };
    }),

  getActivePalette: () => {
    const { activeId, palettes } = get();
    return activeId ? palettes[activeId] ?? null : null;
  }
}));
