import { Button } from '@react95/core';
import { useState } from 'react';
import { PaletteColor } from '../../../../shared/palette-formats';
import { usePaletteStore } from '../../store/paletteStore';
import { BlendDialog } from '../BlendDialog/BlendDialog';
import { ColorDialog } from '../ColorDialog/ColorDialog';
import { ColorList } from '../ColorList/ColorList';
import { ShadeTintDialog } from '../ShadeTintDialog/ShadeTintDialog';
import { PaletteToolbar } from './PaletteToolbar';

type ColorDialogState = { mode: 'add' } | { mode: 'edit'; color: PaletteColor } | null;

export function PaletteView(): JSX.Element {
  const activePalette = usePaletteStore((state) => (state.activeId ? state.palettes[state.activeId] ?? null : null));
  const createPalette = usePaletteStore((state) => state.createPalette);
  const colorSystem = usePaletteStore((state) =>
    state.activeId ? state.colorSystemByPalette[state.activeId] ?? 'hex' : 'hex'
  );
  const setColorSystem = usePaletteStore((state) => state.setColorSystem);
  const [colorDialog, setColorDialog] = useState<ColorDialogState>(null);
  const [isBlendDialogOpen, setIsBlendDialogOpen] = useState(false);
  const [isShadeTintDialogOpen, setIsShadeTintDialogOpen] = useState(false);

  if (!activePalette) {
    return (
      <div className="palette-view palette-view--empty">
        <p>No palette is open.</p>
        <Button onClick={createPalette}>Create new palette</Button>
        <p className="palette-view__hint">You can also import a palette from File → Import Palette…</p>
      </div>
    );
  }

  return (
    <div className="palette-view">
      <PaletteToolbar
        colorSystem={colorSystem}
        onColorSystemChange={(system) => setColorSystem(activePalette.id, system)}
        onAddColor={() => setColorDialog({ mode: 'add' })}
        onAddBlend={() => setIsBlendDialogOpen(true)}
        onAddShadeTint={() => setIsShadeTintDialogOpen(true)}
      />
      <ColorList
        paletteId={activePalette.id}
        colors={activePalette.colors}
        colorSystem={colorSystem}
        onEditColor={(color) => setColorDialog({ mode: 'edit', color })}
      />
      {colorDialog && (
        <ColorDialog
          paletteId={activePalette.id}
          color={colorDialog.mode === 'edit' ? colorDialog.color : undefined}
          colorSystem={colorSystem}
          onClose={() => setColorDialog(null)}
        />
      )}
      {isBlendDialogOpen && (
        <BlendDialog
          paletteId={activePalette.id}
          colors={activePalette.colors}
          colorSystem={colorSystem}
          onClose={() => setIsBlendDialogOpen(false)}
        />
      )}
      {isShadeTintDialogOpen && (
        <ShadeTintDialog
          paletteId={activePalette.id}
          colors={activePalette.colors}
          colorSystem={colorSystem}
          onClose={() => setIsShadeTintDialogOpen(false)}
        />
      )}
    </div>
  );
}
