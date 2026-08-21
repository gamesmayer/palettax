import { usePaletteStore } from '../../store/paletteStore';
import { Tab } from './Tab';

export function TabBar(): JSX.Element {
  const tabOrder = usePaletteStore((state) => state.tabOrder);
  const palettes = usePaletteStore((state) => state.palettes);
  const activeId = usePaletteStore((state) => state.activeId);
  const setActive = usePaletteStore((state) => state.setActive);
  const closeTab = usePaletteStore((state) => state.closeTab);
  const renamePalette = usePaletteStore((state) => state.renamePalette);

  return (
    <div className="tab-bar">
      {tabOrder.map((id) => {
        const palette = palettes[id];
        if (!palette) return null;
        return (
          <Tab
            key={id}
            label={palette.name}
            active={id === activeId}
            onSelect={() => setActive(id)}
            onClose={() => closeTab(id)}
            onRename={(newLabel) => renamePalette(id, newLabel)}
          />
        );
      })}
    </div>
  );
}
