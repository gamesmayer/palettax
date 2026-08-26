import { Button, Frame, Input } from "@react95/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KeyboardEvent, MouseEvent, useState } from "react";
import {
	ColorSystem,
	rgbToCmyk,
	rgbToHsl,
	rgbToHsv,
} from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { CloseIcon } from "../icons/CloseIcon";

interface ColorSwatchProps {
	color: PaletteColor;
	groupId: string;
	colorSystem: ColorSystem;
	onRemove: () => void;
	onRename: (newName: string) => void;
	onEdit: () => void;
}

function formatColorValue(color: PaletteColor, system: ColorSystem): string {
	switch (system) {
		case "hex":
			return color.hex;
		case "rgb":
			return `RGB(${color.r}, ${color.g}, ${color.b})`;
		case "hsl": {
			const { h, s, l } = rgbToHsl(color.r, color.g, color.b);
			return `HSL(${h}, ${s}%, ${l}%)`;
		}
		case "hsb": {
			const { h, s, v } = rgbToHsv(color.r, color.g, color.b);
			return `HSB(${h}, ${s}%, ${v}%)`;
		}
		case "cmyk": {
			const { c, m, y, k } = rgbToCmyk(color.r, color.g, color.b);
			return `CMYK(${c}%, ${m}%, ${y}%, ${k}%)`;
		}
	}
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
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(color.name ?? "");

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	function startEditing(event: MouseEvent): void {
		event.stopPropagation();
		setDraft(color.name ?? "");
		setIsEditing(true);
	}

	function commit(): void {
		onRename(draft);
		setIsEditing(false);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			commit();
		} else if (event.key === "Escape") {
			setDraft(color.name ?? "");
			setIsEditing(false);
		}
	}

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
				title={formatColorValue(color, colorSystem)}
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
			{isEditing ? (
				<Input
					className="color-swatch__name-input"
					value={draft}
					autoFocus
					placeholder="Name"
					onClick={(event) => event.stopPropagation()}
					onChange={(event) => setDraft(event.target.value)}
					onBlur={commit}
					onKeyDown={handleKeyDown}
				/>
			) : (
				<span
					className={
						color.name
							? "color-swatch__label"
							: "color-swatch__label color-swatch__label--unnamed"
					}
					title={color.name ?? color.hex}
					onDoubleClick={startEditing}
				>
					{color.name ?? color.hex}
				</span>
			)}
		</Frame>
	);
}
