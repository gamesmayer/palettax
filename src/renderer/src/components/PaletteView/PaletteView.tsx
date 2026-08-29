import { Button } from "@react95/core";
import { useState } from "react";
import { usePaletteActions } from "../../hooks/usePaletteActions";
import { usePaletteStore } from "../../store/paletteStore";
import { BlendModal } from "../BlendModal/BlendModal";
import { PaletteGroups } from "../ColorList/PaletteGroups";
import { ColorModal } from "../ColorModal/ColorModal";
import { MaterialRampModal } from "../MaterialRampModal/MaterialRampModal";
import { ShadeTintModal } from "../ShadeTintModal/ShadeTintModal";
import { PaletteToolbar } from "./PaletteToolbar";

export function PaletteView(): JSX.Element {
	const activePalette = usePaletteStore((state) =>
		state.activeId ? (state.palettes[state.activeId] ?? null) : null
	);
	const createPalette = usePaletteStore((state) => state.createPalette);
	const { importPalettes } = usePaletteActions();
	const colorSystem = usePaletteStore((state) =>
		state.activeId
			? (state.colorSystemByPalette[state.activeId] ?? "hex")
			: "hex"
	);
	const setColorSystem = usePaletteStore((state) => state.setColorSystem);
	const addGroup = usePaletteStore((state) => state.addGroup);
	const canUndo = usePaletteStore((state) =>
		activePalette
			? (state.undoStacks[activePalette.id]?.length ?? 0) > 0
			: false
	);
	const canRedo = usePaletteStore((state) =>
		activePalette
			? (state.redoStacks[activePalette.id]?.length ?? 0) > 0
			: false
	);
	const undo = usePaletteStore((state) => state.undo);
	const redo = usePaletteStore((state) => state.redo);

	const [isColorModalOpen, setIsColorModalOpen] = useState(false);
	const [isBlendModalOpen, setIsBlendModalOpen] = useState(false);
	const [isShadeTintModalOpen, setIsShadeTintModalOpen] = useState(false);
	const [isMaterialRampModalOpen, setIsMaterialRampModalOpen] = useState(false);

	if (!activePalette) {
		return (
			<div className="palette-view palette-view--empty">
				<p>Where do you want to start?</p>
				<Button onClick={createPalette}>New palette</Button>
				<Button onClick={importPalettes}>Import palette</Button>
			</div>
		);
	}

	const defaultGroupId = activePalette.groups[0]?.id ?? "";

	return (
		<div className="palette-view">
			<PaletteToolbar
				colorSystem={colorSystem}
				onColorSystemChange={(system) =>
					setColorSystem(activePalette.id, system)
				}
				onAddGroup={() => addGroup(activePalette.id)}
				onAddColor={() => setIsColorModalOpen(true)}
				onOpenBlend={() => setIsBlendModalOpen(true)}
				onOpenShadeTint={() => setIsShadeTintModalOpen(true)}
				onOpenMaterialRamp={() => setIsMaterialRampModalOpen(true)}
				onUndo={() => undo(activePalette.id)}
				onRedo={() => redo(activePalette.id)}
				canUndo={canUndo}
				canRedo={canRedo}
			/>
			<PaletteGroups palette={activePalette} colorSystem={colorSystem} />
			{isColorModalOpen && (
				<ColorModal
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsColorModalOpen(false)}
				/>
			)}
			{isBlendModalOpen && (
				<BlendModal
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsBlendModalOpen(false)}
				/>
			)}
			{isShadeTintModalOpen && (
				<ShadeTintModal
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsShadeTintModalOpen(false)}
				/>
			)}
			{isMaterialRampModalOpen && (
				<MaterialRampModal
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsMaterialRampModalOpen(false)}
				/>
			)}
		</div>
	);
}
