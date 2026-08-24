import { Button, Dropdown, Frame } from "@react95/core";
import { ChangeEvent } from "react";
import { ColorSystem } from "../../../../shared/color";
import { PlusIcon } from "../icons/PlusIcon";
import { RedoIcon } from "../icons/RedoIcon";
import { UndoIcon } from "../icons/UndoIcon";

interface PaletteToolbarProps {
	colorSystem: ColorSystem;
	onColorSystemChange: (system: ColorSystem) => void;
	onAddGroup: () => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

const COLOR_SYSTEM_LABELS: Record<ColorSystem, string> = {
	hex: "Hex",
	rgb: "RGB",
	hsl: "HSL",
	hsb: "HSB",
	cmyk: "CMYK",
};

const COLOR_SYSTEM_BY_LABEL: Record<string, ColorSystem> = {
	Hex: "hex",
	RGB: "rgb",
	HSL: "hsl",
	HSB: "hsb",
	CMYK: "cmyk",
};

export function PaletteToolbar({
	colorSystem,
	onColorSystemChange,
	onAddGroup,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
}: PaletteToolbarProps): JSX.Element {
	return (
		<Frame className="palette-toolbar">
			<div className="palette-toolbar__left">
				<Button
					className="palette-toolbar__icon-btn"
					onClick={onUndo}
					disabled={!canUndo}
					aria-label="Undo"
				>
					<UndoIcon />
				</Button>
				<Button
					className="palette-toolbar__icon-btn"
					onClick={onRedo}
					disabled={!canRedo}
					aria-label="Redo"
				>
					<RedoIcon />
				</Button>
			</div>
			<div className="palette-toolbar__center">
				<Dropdown
					className="palette-toolbar__color-system"
					options={Object.values(COLOR_SYSTEM_LABELS)}
					value={COLOR_SYSTEM_LABELS[colorSystem]}
					onChange={(event: ChangeEvent<HTMLSelectElement>) =>
						onColorSystemChange(COLOR_SYSTEM_BY_LABEL[event.target.value])
					}
					aria-label="Color system"
				/>
			</div>
			<div className="palette-toolbar__right">
				<Button onClick={onAddGroup}>
					<PlusIcon /> Add group
				</Button>
			</div>
		</Frame>
	);
}
