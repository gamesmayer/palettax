import { useEffect, useState } from "react";
import { UpdateInfo } from "../../shared/ipc-contract";
import { ConfirmDialog } from "./components/ConfirmDialog/ConfirmDialog";
import { PaletteView } from "./components/PaletteView/PaletteView";
import { TabBar } from "./components/TabBar/TabBar";
import { UpdateDialog } from "./components/UpdateDialog/UpdateDialog";
import { usePaletteActions } from "./hooks/usePaletteActions";
import { usePaletteStore } from "./store/paletteStore";

export function App(): JSX.Element {
	const { importPalettes, exportActivePalette } = usePaletteActions();
	const createPalette = usePaletteStore((state) => state.createPalette);
	const hasOpenPalettes = usePaletteStore((state) => state.tabOrder.length > 0);
	const [isConfirmingAppClose, setIsConfirmingAppClose] = useState(false);
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

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
		const offUpdateAvailable = window.paletteApi.onUpdateAvailable((info) => {
			setUpdateInfo(info);
		});
		return () => {
			offImport();
			offExport();
			offNewPalette();
			offRequestClose();
			offUpdateAvailable();
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
		</div>
	);
}
