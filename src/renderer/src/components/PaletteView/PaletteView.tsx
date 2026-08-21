import { useState } from 'react';
import { PaletteColor } from '../../../../shared/palette-formats';
import { usePaletteStore } from '../../store/paletteStore';
import { ColorDialog } from '../ColorDialog/ColorDialog';
import { ColorList } from '../ColorList/ColorList';
import { PaletteToolbar } from './PaletteToolbar';

type ColorDialogState = { mode: 'add' } | { mode: 'edit'; color: PaletteColor } | null;

export function PaletteView(): JSX.Element {
  const activePalette = usePaletteStore((state) => (state.activeId ? state.palettes[state.activeId] ?? null : null));
  const createPalette = usePaletteStore((state) => state.createPalette);
  const [colorDialog, setColorDialog] = useState<ColorDialogState>(null);

  if (!activePalette) {
    return (
      <div className="palette-view palette-view--empty">
        <p>No hay ninguna paleta abierta.</p>
        <button onClick={createPalette}>Crear paleta nueva</button>
        <p className="palette-view__hint">También puedes importar una paleta desde File → Import Palette…</p>
      </div>
    );
  }

  return (
    <div className="palette-view">
      <PaletteToolbar onAddColor={() => setColorDialog({ mode: 'add' })} />
      <ColorList
        paletteId={activePalette.id}
        colors={activePalette.colors}
        onEditColor={(color) => setColorDialog({ mode: 'edit', color })}
      />
      {colorDialog && (
        <ColorDialog
          paletteId={activePalette.id}
          color={colorDialog.mode === 'edit' ? colorDialog.color : undefined}
          onClose={() => setColorDialog(null)}
        />
      )}
    </div>
  );
}
