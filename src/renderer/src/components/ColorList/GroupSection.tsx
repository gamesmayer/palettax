import { Button, Frame } from "@react95/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorSystem } from "../../../../shared/color";
import {
	Palette,
	PaletteColor,
	PaletteGroup,
} from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { ColorModal } from "../ColorModal/ColorModal";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import { EditableText } from "../EditableText/EditableText";
import { CloseIcon } from "../icons/CloseIcon";
import { ColorGrid } from "./ColorGrid";

interface GroupSectionProps {
	palette: Palette;
	group: PaletteGroup;
	colorSystem: ColorSystem;
}

export function headerSortableId(groupId: string): string {
	return `header:${groupId}`;
}

export function GroupSection({
	palette,
	group,
	colorSystem,
}: GroupSectionProps): JSX.Element {
	const { t } = useTranslation(["common", "app"]);
	const renameGroup = usePaletteStore((state) => state.renameGroup);
	const removeGroup = usePaletteStore((state) => state.removeGroup);
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({
			id: headerSortableId(group.id),
			data: { type: "groupHeader", groupId: group.id },
		});

	const [editingColor, setEditingColor] = useState<PaletteColor | null>(null);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Frame className="group-section" ref={setNodeRef} style={style}>
			<div className="group-section__header">
				<span
					className="group-section__drag-handle"
					{...attributes}
					{...listeners}
				>
					⠿
				</span>
				<div className="group-section__title">
					<EditableText
						value={group.name ?? ""}
						displayValue={group.name ?? t("app:groupSection.ungrouped")}
						onCommit={(name) => renameGroup(palette.id, group.id, name)}
						className="group-section__name"
					/>
					<span className="group-section__count">
						{t("app:groupSection.colorCount", { count: group.colors.length })}
					</span>
				</div>
				<div className="group-section__actions">
					<Button
						className="group-section__delete-btn"
						onClick={() => setIsConfirmingDelete(true)}
						aria-label={t("app:groupSection.deleteAriaLabel")}
					>
						<CloseIcon />
					</Button>
				</div>
			</div>
			<ColorGrid
				paletteId={palette.id}
				groupId={group.id}
				colors={group.colors}
				colorSystem={colorSystem}
				onEditColor={setEditingColor}
			/>
			{editingColor && (
				<ColorModal
					paletteId={palette.id}
					groupId={group.id}
					groups={palette.groups}
					color={editingColor}
					colorSystem={colorSystem}
					onClose={() => setEditingColor(null)}
				/>
			)}
			{isConfirmingDelete && (
				<ConfirmModal
					title={t("app:groupSection.deleteConfirmTitle")}
					message={t("app:groupSection.deleteConfirmMessage", {
						name: group.name ?? t("app:groupSection.ungrouped"),
						count: group.colors.length,
					})}
					confirmLabel={t("app:groupSection.deleteConfirmLabel")}
					cancelLabel={t("common:cancel")}
					onConfirm={() => {
						removeGroup(palette.id, group.id);
						setIsConfirmingDelete(false);
					}}
					onCancel={() => setIsConfirmingDelete(false)}
				/>
			)}
		</Frame>
	);
}
