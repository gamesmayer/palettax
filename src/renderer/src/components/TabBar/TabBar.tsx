import { Frame } from '@react95/core';
import { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { usePaletteStore } from '../../store/paletteStore';
import { Tab } from './Tab';

export function TabBar(): JSX.Element {
  const tabOrder = usePaletteStore((state) => state.tabOrder);
  const palettes = usePaletteStore((state) => state.palettes);
  const activeId = usePaletteStore((state) => state.activeId);
  const setActive = usePaletteStore((state) => state.setActive);
  const closeTab = usePaletteStore((state) => state.closeTab);
  const renamePalette = usePaletteStore((state) => state.renamePalette);
  const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);

  const pendingClosePalette = pendingCloseId ? palettes[pendingCloseId] : undefined;

  return (
    <>
      <Frame as="ol" className="tab-bar">
        {tabOrder.map((id) => {
          const palette = palettes[id];
          if (!palette) return null;
          return (
            <Tab
              key={id}
              label={palette.name}
              active={id === activeId}
              onSelect={() => setActive(id)}
              onClose={() => setPendingCloseId(id)}
              onRename={(newLabel) => renamePalette(id, newLabel)}
            />
          );
        })}
      </Frame>
      {pendingCloseId && pendingClosePalette && (
        <ConfirmDialog
          title="Close palette"
          message={`Close "${pendingClosePalette.name}"? Any unexported changes will be lost.`}
          confirmLabel="Close"
          cancelLabel="Cancel"
          onConfirm={() => {
            closeTab(pendingCloseId);
            setPendingCloseId(null);
          }}
          onCancel={() => setPendingCloseId(null)}
        />
      )}
    </>
  );
}
