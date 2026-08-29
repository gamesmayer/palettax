import { Button, Frame } from "@react95/core";
import { ColorSystem, formatColorForSystem } from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { FieldLabel } from "../Field/Field";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";
import { SwatchColorPicker } from "./SwatchColorPicker";

export type EndpointMode = "palette" | "new";
export type Rgb = { r: number; g: number; b: number };

interface EndpointPickerProps {
	label: string;
	/** Optional tooltip for the field label, portaled via FloatingTooltip (not react95's Tooltip) so it isn't clipped near the edge of the modal's scrolling content. */
	tooltip?: string;
	mode: EndpointMode;
	onModeChange: (mode: EndpointMode) => void;
	colors: PaletteColor[];
	colorSystem: ColorSystem;
	paletteColorId: string;
	onPaletteColorChange: (colorId: string) => void;
	customRgb: Rgb;
	onCustomRgbChange: (rgb: Rgb) => void;
}

export function EndpointPicker({
	label,
	tooltip,
	mode,
	onModeChange,
	colors,
	colorSystem,
	paletteColorId,
	onPaletteColorChange,
	customRgb,
	onCustomRgbChange,
}: EndpointPickerProps): JSX.Element {
	return (
		<div className="field">
			<FieldLabel text={label} tooltip={tooltip} />
			<div className="endpoint-picker__mode-toggle">
				<Button
					className={
						mode === "palette"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					disabled={colors.length === 0}
					onClick={() => onModeChange("palette")}
				>
					Palette color
				</Button>
				<Button
					className={
						mode === "new"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => onModeChange("new")}
				>
					New color
				</Button>
			</div>
			{mode === "palette" ? (
				<div className="endpoint-picker__swatch-picker">
					{colors.map((color) => (
						<FloatingTooltip
							key={color.id}
							text={formatColorForSystem(color, colorSystem)}
						>
							<Frame
								as="button"
								className={
									color.id === paletteColorId
										? "endpoint-picker__chip endpoint-picker__chip--selected"
										: "endpoint-picker__chip"
								}
								style={{ backgroundColor: color.hex }}
								onClick={() => onPaletteColorChange(color.id)}
								aria-label={`${label}: ${formatColorForSystem(color, colorSystem)}`}
							/>
						</FloatingTooltip>
					))}
				</div>
			) : (
				<SwatchColorPicker
					label={label}
					hideLabel
					colorSystem={colorSystem}
					rgb={customRgb}
					onChange={onCustomRgbChange}
				/>
			)}
		</div>
	);
}
