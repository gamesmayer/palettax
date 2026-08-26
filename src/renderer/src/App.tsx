import { useEffect, useState } from "react";
import { UpdateInfo } from "../../shared/ipc-contract";
import { flattenGroups } from "../../shared/paletteGroups";
import { ConfirmDialog } from "./components/ConfirmDialog/ConfirmDialog";
import { HelpDialog } from "./components/HelpDialog/HelpDialog";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts/KeyboardShortcuts";
import { PaletteView } from "./components/PaletteView/PaletteView";
import { PngExportDialog } from "./components/PngExportDialog/PngExportDialog";
import { TabBar } from "./components/TabBar/TabBar";
import { UpdateDialog } from "./components/UpdateDialog/UpdateDialog";
import { usePaletteActions } from "./hooks/usePaletteActions";
import { usePaletteStore } from "./store/paletteStore";

export function App(): JSX.Element {
	const { importPalettes, exportActivePalette } = usePaletteActions();
	const createPalette = usePaletteStore((state) => state.createPalette);
	const hasOpenPalettes = usePaletteStore((state) => state.tabOrder.length > 0);
	const [isConfirmingAppClose, setIsConfirmingAppClose] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
	const [pngExportContext, setPngExportContext] = useState<{
		colorCount: number;
	} | null>(null);

	useEffect(() => {
		const offImport = window.paletteApi.onTriggerImport(() => {
			importPalettes();
		});
		const offExport = window.paletteApi.onTriggerExport((format) => {
			if (format === "png") {
				const palette = usePaletteStore.getState().getActivePalette();
				if (palette) {
					setPngExportContext({
						colorCount: flattenGroups(palette.groups).length,
					});
				}
			} else {
				exportActivePalette(format);
			}
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
		const offUpdateAvailable = window.paletteApi.onUpdateAvailable((info) => {
			setUpdateInfo(info);
		});
		const offHelp = window.paletteApi.onTriggerHelp(() => {
			setShowHelp(true);
		});
		return () => {
			offImport();
			offExport();
			offNewPalette();
			offRequestClose();
			offUpdateAvailable();
			offHelp();
		};
	}, [importPalettes, exportActivePalette, createPalette]);

	return (
		<div className="app">
			<KeyboardShortcuts />
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
			{updateInfo && (
				<UpdateDialog
					updateInfo={updateInfo}
					onDownload={() => {
						window.paletteApi.openExternalUrl(updateInfo.releaseUrl);
						setUpdateInfo(null);
					}}
					onDismiss={() => setUpdateInfo(null)}
				/>
			)}
			{showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
			{pngExportContext && (
				<PngExportDialog
					colorCount={pngExportContext.colorCount}
					onClose={() => setPngExportContext(null)}
					onConfirm={(options) => {
						exportActivePalette("png", options);
						setPngExportContext(null);
					}}
				/>
			)}
		</div>
	);
}
