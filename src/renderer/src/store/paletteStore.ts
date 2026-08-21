import { create } from 'zustand';
import { generateId } from '../../../shared/color';
import { Palette, PaletteColor } from '../../../shared/palette-formats';

interface PaletteStoreState {
  palettes: Record<string, Palette>;
  tabOrder: string[];
  activeId: string | null;

  addPalette: (palette: Palette) => void;
  createPalette: () => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  renamePalette: (paletteId: string, name: string) => void;
  addColor: (paletteId: string, color: Omit<PaletteColor, 'id'>) => void;
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
  const untitledCount = Object.values(palettes).filter((palette) => /^Sin título( \d+)?$/.test(palette.name)).length;
  return untitledCount === 0 ? 'Sin título' : `Sin título ${untitledCount + 1}`;
}

export const usePaletteStore = create<PaletteStoreState>((set, get) => ({
  palettes: {},
  tabOrder: [],
  activeId: null,

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
      const tabOrder = state.tabOrder.filter((tabId) => tabId !== id);
      const activeId = state.activeId === id ? tabOrder[tabOrder.length - 1] ?? null : state.activeId;
      return { palettes, tabOrder, activeId };
    }),

  setActive: (id) => set({ activeId: id }),

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
