import { Button, Frame } from "@react95/core";
import { useTranslation } from "react-i18next";
import { ColorSystem, formatColorForSystem } from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { FieldLabel } from "../Field/Field";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";
import { SwatchColorPicker } from "./SwatchColorPicker";

export type EndpointMode = "palette" | "new";
export type Rgb = { r: number; g: number; b: number };

// Defaults to "new" rather than "palette" even when palette colors exist --
// picking a fresh color is the more common starting point than reusing one
// already in the palette.
export const DEFAULT_ENDPOINT_MODE: EndpointMode = "new";

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
	const { t } = useTranslation("app");
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
					{t("endpointPicker.paletteColorButton")}
				</Button>
				<Button
					className={
						mode === "new"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => onModeChange("new")}
				>
					{t("endpointPicker.newColorButton")}
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
								aria-label={t("endpointPicker.colorAriaLabel", {
									label,
									value: formatColorForSystem(color, colorSystem),
								})}
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
