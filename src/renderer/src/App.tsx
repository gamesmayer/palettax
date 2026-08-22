import { useEffect, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog/ConfirmDialog';
import { PaletteView } from './components/PaletteView/PaletteView';
import { TabBar } from './components/TabBar/TabBar';
import { usePaletteActions } from './hooks/usePaletteActions';
import { usePaletteStore } from './store/paletteStore';

export function App(): JSX.Element {
  const { importPalettes, exportActivePalette } = usePaletteActions();
  const createPalette = usePaletteStore((state) => state.createPalette);
  const hasOpenPalettes = usePaletteStore((state) => state.tabOrder.length > 0);
  const [isConfirmingAppClose, setIsConfirmingAppClose] = useState(false);

  useEffect(() => {
    const offImport = window.paletteApi.onTriggerImport(() => {
      importPalettes();
    });
    const offExport = window.paletteApi.onTriggerExport((format) => {
      exportActivePalette(format);
    });
    const offNewPalette = window.paletteApi.onTriggerNewPalette(() => {
      createPalette();
    });
    const offRequestClose = window.paletteApi.onRequestClose(() => {
      if (usePaletteStore.getState().tabOrder.length === 0) {
        window.paletteApi.confirmClose();
      } else {
        setIsConfirmingAppClose(true);
      }
    });
    return () => {
      offImport();
      offExport();
      offNewPalette();
      offRequestClose();
    };
  }, [importPalettes, exportActivePalette, createPalette]);

  return (
    <div className="app">
      {hasOpenPalettes && <TabBar />}
      <PaletteView />
      {isConfirmingAppClose && (
        <ConfirmDialog
          title="Close Palettax"
          message="Close the application? Any unexported changes in open palettes will be lost."
          confirmLabel="Close"
          cancelLabel="Cancel"
          onConfirm={() => window.paletteApi.confirmClose()}
          onCancel={() => setIsConfirmingAppClose(false)}
        />
      )}
    </div>
  );
}
