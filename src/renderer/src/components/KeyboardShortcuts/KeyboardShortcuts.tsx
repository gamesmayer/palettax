import { useEffect } from "react";
import { usePaletteStore } from "../../store/paletteStore";

export function KeyboardShortcuts(): null {
	const activePaletteId = usePaletteStore((state) => state.activeId);
	const canUndo = usePaletteStore((state) =>
		activePaletteId
			? (state.undoStacks[activePaletteId]?.length ?? 0) > 0
			: false
	);
	const canRedo = usePaletteStore((state) =>
		activePaletteId
			? (state.redoStacks[activePaletteId]?.length ?? 0) > 0
			: false
	);
	const undo = usePaletteStore((state) => state.undo);
	const redo = usePaletteStore((state) => state.redo);

	useEffect(() => {
		if (!activePaletteId) return;
		const paletteId = activePaletteId;

		function handleKeyDown(event: KeyboardEvent): void {
			const isModifierPressed = event.ctrlKey || event.metaKey;
			if (!isModifierPressed || event.key.toLowerCase() !== "z") return;

			const target = event.target as HTMLElement | null;
			if (target?.closest("input, textarea")) return;

			event.preventDefault();
			if (event.shiftKey) {
				if (canRedo) redo(paletteId);
			} else {
				if (canUndo) undo(paletteId);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activePaletteId, canUndo, canRedo, undo, redo]);

	return null;
}
