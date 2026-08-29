import { Frame } from "@react95/core";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { ColorSystem } from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { ColorSwatch } from "./ColorSwatch";

interface ColorGridProps {
	paletteId: string;
	groupId: string;
	colors: PaletteColor[];
	colorSystem: ColorSystem;
	onEditColor: (color: PaletteColor) => void;
}

export function ColorGrid({
	paletteId,
	groupId,
	colors,
	colorSystem,
	onEditColor,
}: ColorGridProps): JSX.Element {
	const { t } = useTranslation("app");
	const removeColor = usePaletteStore((state) => state.removeColor);
	const renameColor = usePaletteStore((state) => state.renameColor);
	const { setNodeRef } = useDroppable({
		id: groupId,
		data: { type: "group", groupId },
	});

	const colorIds = colors.map((color) => color.id);

	return (
		<Frame className="color-grid" ref={setNodeRef}>
			{colors.length === 0 ? (
				<div className="color-grid__empty">
					<span className="color-swatch__drag-handle" aria-hidden="true">
						⠿
					</span>
					<span className="color-swatch__chip" aria-hidden="true" />
					<span className="color-swatch__label" aria-hidden="true">
						&nbsp;
					</span>
					<p className="color-grid__empty-text">{t("colorGrid.emptyText")}</p>
				</div>
			) : (
				<SortableContext items={colorIds} strategy={rectSortingStrategy}>
					{colors.map((color) => (
						<ColorSwatch
							key={color.id}
							color={color}
							groupId={groupId}
							colorSystem={colorSystem}
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
