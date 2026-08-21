import { useEffect } from 'react';
import { PaletteView } from './components/PaletteView/PaletteView';
import { TabBar } from './components/TabBar/TabBar';
import { usePaletteActions } from './hooks/usePaletteActions';
import { usePaletteStore } from './store/paletteStore';

export function App(): JSX.Element {
  const { importPalettes, exportActivePalette } = usePaletteActions();
  const createPalette = usePaletteStore((state) => state.createPalette);

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
    return () => {
      offImport();
      offExport();
      offNewPalette();
    };
  }, [importPalettes, exportActivePalette, createPalette]);

  return (
    <div className="app">
      <TabBar />
      <PaletteView />
    </div>
  );
}
