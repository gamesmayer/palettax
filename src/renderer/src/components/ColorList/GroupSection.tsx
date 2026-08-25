import { Button, Frame, Input } from "@react95/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KeyboardEvent, MouseEvent, useState } from "react";
import { ColorSystem } from "../../../../shared/color";
import {
	Palette,
	PaletteColor,
	PaletteGroup,
} from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import { ColorDialog } from "../ColorDialog/ColorDialog";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
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
	const renameGroup = usePaletteStore((state) => state.renameGroup);
	const removeGroup = usePaletteStore((state) => state.removeGroup);
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({
			id: headerSortableId(group.id),
			data: { type: "groupHeader", groupId: group.id },
		});

	const [isEditingName, setIsEditingName] = useState(false);
	const [nameDraft, setNameDraft] = useState(group.name ?? "");
	const [editingColor, setEditingColor] = useState<PaletteColor | null>(null);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	function startEditingName(event: MouseEvent): void {
		event.stopPropagation();
		setNameDraft(group.name ?? "");
		setIsEditingName(true);
	}

	function commitName(): void {
		const trimmed = nameDraft.trim();
		if (trimmed.length > 0 && trimmed !== (group.name ?? "")) {
			renameGroup(palette.id, group.id, trimmed);
		}
		setIsEditingName(false);
	}

	function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			commitName();
		} else if (event.key === "Escape") {
			setNameDraft(group.name ?? "");
			setIsEditingName(false);
		}
	}

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
					{isEditingName ? (
						<Input
							className="group-section__name-input"
							value={nameDraft}
							autoFocus
							onClick={(event) => event.stopPropagation()}
							onChange={(event) => setNameDraft(event.target.value)}
							onBlur={commitName}
							onKeyDown={handleNameKeyDown}
						/>
					) : (
						<span
							className="group-section__name"
							onDoubleClick={startEditingName}
						>
							{group.name ?? "Ungrouped"}
						</span>
					)}
					<span className="group-section__count">
						{group.colors.length} color{group.colors.length === 1 ? "" : "s"}
					</span>
				</div>
				<div className="group-section__actions">
					<Button
						className="group-section__delete-btn"
						onClick={() => setIsConfirmingDelete(true)}
						aria-label="Delete group"
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
				<ColorDialog
					paletteId={palette.id}
					groupId={group.id}
					groups={palette.groups}
					color={editingColor}
					colorSystem={colorSystem}
					onClose={() => setEditingColor(null)}
				/>
			)}
			{isConfirmingDelete && (
				<ConfirmDialog
					title="Delete group"
					message={`Delete "${group.name ?? "Ungrouped"}"? Its ${group.colors.length} color${
						group.colors.length === 1 ? "" : "s"
					} will be lost.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
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
