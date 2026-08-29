import { Frame } from "@react95/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import { formatPaletteName, usePaletteStore } from "../../store/paletteStore";
import { Tab } from "./Tab";

export function TabBar(): JSX.Element {
	const { t } = useTranslation(["common", "app"]);
	const tabOrder = usePaletteStore((state) => state.tabOrder);
	const palettes = usePaletteStore((state) => state.palettes);
	const activeId = usePaletteStore((state) => state.activeId);
	const setActive = usePaletteStore((state) => state.setActive);
	const closeTab = usePaletteStore((state) => state.closeTab);
	const renamePalette = usePaletteStore((state) => state.renamePalette);
	const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);

	const pendingClosePalette = pendingCloseId
		? palettes[pendingCloseId]
		: undefined;

	return (
		<>
			<Frame as="ol" className="tab-bar">
				{tabOrder.map((id) => {
					const palette = palettes[id];
					if (!palette) return null;
					return (
						<Tab
							key={id}
							label={formatPaletteName(palette.name, () =>
								t("app:untitledPalette")
							)}
							active={id === activeId}
							onSelect={() => setActive(id)}
							onClose={() => setPendingCloseId(id)}
							onRename={(newLabel) => renamePalette(id, newLabel)}
						/>
					);
				})}
			</Frame>
			{pendingCloseId && pendingClosePalette && (
				<ConfirmModal
					title={t("app:tabBar.closeConfirmTitle")}
					message={t("app:tabBar.closeConfirmMessage", {
						name: formatPaletteName(pendingClosePalette.name, () =>
							t("app:untitledPalette")
						),
					})}
					confirmLabel={t("common:close")}
					cancelLabel={t("common:cancel")}
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
