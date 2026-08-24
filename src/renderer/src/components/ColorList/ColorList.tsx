import { Frame } from "@react95/core";
import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ColorSystem } from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { ColorSwatch } from "./ColorSwatch";

interface ColorListProps {
	paletteId: string;
	groupId: string;
	colors: PaletteColor[];
	colorSystem: ColorSystem;
	onEditColor: (color: PaletteColor) => void;
}

export function ColorList({
	paletteId,
	groupId,
	colors,
	colorSystem,
	onEditColor,
}: ColorListProps): JSX.Element {
	const reorderColors = usePaletteStore((state) => state.reorderColors);
	const removeColor = usePaletteStore((state) => state.removeColor);
	const renameColor = usePaletteStore((state) => state.renameColor);
	const { setNodeRef } = useDroppable({
		id: groupId,
		data: { type: "group", groupId },
	});

	const colorIds = colors.map((color) => color.id);

	function moveColor(colorId: string, direction: -1 | 1): void {
		const index = colorIds.indexOf(colorId);
		const targetIndex = index + direction;
		if (targetIndex < 0 || targetIndex >= colorIds.length) return;
		reorderColors(paletteId, groupId, arrayMove(colorIds, index, targetIndex));
	}

	return (
		<Frame className="color-list" ref={setNodeRef}>
			{colors.length === 0 ? (
				<p className="color-list__empty">This group has no colors yet.</p>
			) : (
				<SortableContext
					items={colorIds}
					strategy={verticalListSortingStrategy}
				>
					{colors.map((color, index) => (
						<ColorSwatch
							key={color.id}
							color={color}
							groupId={groupId}
							colorSystem={colorSystem}
							canMoveUp={index > 0}
							canMoveDown={index < colors.length - 1}
							onMoveUp={() => moveColor(color.id, -1)}
							onMoveDown={() => moveColor(color.id, 1)}
							onRemove={() => removeColor(paletteId, groupId, color.id)}
							onRename={(newName) =>
								renameColor(paletteId, groupId, color.id, newName)
							}
							onEdit={() => onEditColor(color)}
						/>
					))}
				</SortableContext>
			)}
		</Frame>
	);
}
