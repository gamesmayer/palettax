import { Button } from "@react95/core";
import { usePaletteActions } from "../../hooks/usePaletteActions";
import { usePaletteStore } from "../../store/paletteStore";
import { PaletteGroups } from "../ColorList/PaletteGroups";
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

	if (!activePalette) {
		return (
			<div className="palette-view palette-view--empty">
				<p>No palette is open.</p>
				<Button onClick={createPalette}>Create new palette</Button>
				<Button onClick={importPalettes}>Import palette</Button>
			</div>
		);
	}

	return (
		<div className="palette-view">
			<PaletteToolbar
				colorSystem={colorSystem}
				onColorSystemChange={(system) =>
					setColorSystem(activePalette.id, system)
				}
				onAddGroup={() => addGroup(activePalette.id)}
				onUndo={() => undo(activePalette.id)}
				onRedo={() => redo(activePalette.id)}
				canUndo={canUndo}
				canRedo={canRedo}
			/>
			<PaletteGroups palette={activePalette} colorSystem={colorSystem} />
		</div>
	);
}
