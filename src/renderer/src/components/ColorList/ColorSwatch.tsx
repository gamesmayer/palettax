import { Button, Frame } from "@react95/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MouseEvent } from "react";
import { ColorSystem, formatColorForSystem } from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { EditableText } from "../EditableText/EditableText";
import { CloseIcon } from "../icons/CloseIcon";

interface ColorSwatchProps {
	color: PaletteColor;
	groupId: string;
	colorSystem: ColorSystem;
	onRemove: () => void;
	onRename: (newName: string) => void;
	onEdit: () => void;
}

export function ColorSwatch({
	color,
	groupId,
	colorSystem,
	onRemove,
	onRename,
	onEdit,
}: ColorSwatchProps): JSX.Element {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: color.id, data: { type: "color", groupId } });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<Frame
			className={
				isDragging ? "color-swatch color-swatch--ghost" : "color-swatch"
			}
			ref={setNodeRef}
			style={style}
		>
			<span
				className="color-swatch__drag-handle"
				{...attributes}
				{...listeners}
			>
				⠿
			</span>
			<Frame
				as="button"
				className="color-swatch__chip"
				style={{ backgroundColor: color.hex }}
				title={formatColorForSystem(color, colorSystem)}
				onClick={(event: MouseEvent<HTMLButtonElement>) => {
					event.stopPropagation();
					onEdit();
				}}
				aria-label={`Edit color ${color.hex}`}
			/>
			<Button
				className="color-swatch__delete-btn"
				onClick={onRemove}
				aria-label="Remove color"
			>
				<CloseIcon size="s" />
			</Button>
			<EditableText
				value={color.name ?? ""}
				displayValue={color.name || color.hex}
				onCommit={onRename}
				allowEmpty
				placeholder="Name"
				className={
					color.name
						? "color-swatch__label"
						: "color-swatch__label color-swatch__label--unnamed"
				}
				inputClassName="color-swatch__name-input"
				title={color.name ?? color.hex}
			/>
		</Frame>
	);
}
