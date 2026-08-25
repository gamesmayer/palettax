import { Button } from "@react95/core";
import { useState } from "react";
import { usePaletteActions } from "../../hooks/usePaletteActions";
import { usePaletteStore } from "../../store/paletteStore";
import { BlendDialog } from "../BlendDialog/BlendDialog";
import { PaletteGroups } from "../ColorList/PaletteGroups";
import { ColorDialog } from "../ColorDialog/ColorDialog";
import { ShadeTintDialog } from "../ShadeTintDialog/ShadeTintDialog";
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

	const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
	const [isBlendDialogOpen, setIsBlendDialogOpen] = useState(false);
	const [isShadeTintDialogOpen, setIsShadeTintDialogOpen] = useState(false);

	if (!activePalette) {
		return (
			<div className="palette-view palette-view--empty">
				<p>Where do you want to start?</p>
				<Button onClick={createPalette}>New palette</Button>
				<Button onClick={importPalettes}>Import palette</Button>
			</div>
		);
	}

	const canAddColor = activePalette.groups.length > 0;
	const defaultGroupId = activePalette.groups[0]?.id ?? "";

	return (
		<div className="palette-view">
			<PaletteToolbar
				colorSystem={colorSystem}
				onColorSystemChange={(system) =>
					setColorSystem(activePalette.id, system)
				}
				onAddGroup={() => addGroup(activePalette.id)}
				onAddColor={() => setIsColorDialogOpen(true)}
				onOpenBlend={() => setIsBlendDialogOpen(true)}
				onOpenShadeTint={() => setIsShadeTintDialogOpen(true)}
				canAddColor={canAddColor}
				onUndo={() => undo(activePalette.id)}
				onRedo={() => redo(activePalette.id)}
				canUndo={canUndo}
				canRedo={canRedo}
			/>
			<PaletteGroups palette={activePalette} colorSystem={colorSystem} />
			{isColorDialogOpen && (
				<ColorDialog
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsColorDialogOpen(false)}
				/>
			)}
			{isBlendDialogOpen && (
				<BlendDialog
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsBlendDialogOpen(false)}
				/>
			)}
			{isShadeTintDialogOpen && (
				<ShadeTintDialog
					paletteId={activePalette.id}
					groupId={defaultGroupId}
					groups={activePalette.groups}
					colorSystem={colorSystem}
					onClose={() => setIsShadeTintDialogOpen(false)}
				/>
			)}
		</div>
	);
}
