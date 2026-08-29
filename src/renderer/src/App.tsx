import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UpdateInfo } from "../../shared/ipc-contract";
import { flattenGroups } from "../../shared/paletteGroups";
import { ConfirmModal } from "./components/ConfirmModal/ConfirmModal";
import { HelpModal } from "./components/HelpModal/HelpModal";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts/KeyboardShortcuts";
import { PaletteView } from "./components/PaletteView/PaletteView";
import { PngExportModal } from "./components/PngExportModal/PngExportModal";
import { PreferencesModal } from "./components/PreferencesModal/PreferencesModal";
import { TabBar } from "./components/TabBar/TabBar";
import { UpdateModal } from "./components/UpdateModal/UpdateModal";
import { usePaletteActions } from "./hooks/usePaletteActions";
import { usePaletteStore } from "./store/paletteStore";

export function App(): JSX.Element {
	const { t } = useTranslation(["common", "app"]);
	const { importPalettes, exportActivePalette } = usePaletteActions();
	const createPalette = usePaletteStore((state) => state.createPalette);
	const hasOpenPalettes = usePaletteStore((state) => state.tabOrder.length > 0);
	const [isConfirmingAppClose, setIsConfirmingAppClose] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [showPreferences, setShowPreferences] = useState(false);
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
		const offPreferences = window.settingsApi.onTriggerPreferences(() => {
			setShowPreferences(true);
		});
		return () => {
			offImport();
			offExport();
			offNewPalette();
			offRequestClose();
			offUpdateAvailable();
			offHelp();
			offPreferences();
		};
	}, [importPalettes, exportActivePalette, createPalette]);

	return (
		<div className="app">
			<KeyboardShortcuts />
			{hasOpenPalettes && <TabBar />}
			<PaletteView />
			{isConfirmingAppClose && (
				<ConfirmModal
					title={t("app:appCloseConfirm.title")}
					message={t("app:appCloseConfirm.message")}
					confirmLabel={t("common:close")}
					cancelLabel={t("common:cancel")}
					onConfirm={() => window.paletteApi.confirmClose()}
					onCancel={() => setIsConfirmingAppClose(false)}
				/>
			)}
			{updateInfo && (
				<UpdateModal
					updateInfo={updateInfo}
					onDownload={() => {
						window.paletteApi.openExternalUrl(updateInfo.releaseUrl);
						setUpdateInfo(null);
					}}
					onDismiss={() => setUpdateInfo(null)}
				/>
			)}
			{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
			{showPreferences && (
				<PreferencesModal onClose={() => setShowPreferences(false)} />
			)}
			{pngExportContext && (
				<PngExportModal
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
