import { Button } from "@react95/core";
import { useState } from "react";
import { rgbToHex } from "../../../../shared/color";
import {
	linearToRgbBytes,
	rgbBytesToLinear,
	rgbLinearToOklab,
} from "../../../../shared/materialRamp/colorSpace";
import { DenseSample } from "../../../../shared/materialRamp/posterize";
import { MaterialRampStop } from "../../../../shared/materialRamp/types";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";

interface MaterialRampPreviewProps {
	dense: DenseSample[];
	stops: MaterialRampStop[];
}

type PreviewMode = "value" | "orientation";

const GRADIENT_SAMPLE_STRIDE = 8;

function buildGradient(dense: DenseSample[]): string {
	const stops: string[] = [];
	for (let i = 0; i < dense.length; i += GRADIENT_SAMPLE_STRIDE) {
		const { r, g, b } = linearToRgbBytes(dense[i].rgbLinear);
		stops.push(`${rgbToHex(r, g, b)} ${(dense[i].t * 100).toFixed(2)}%`);
	}
	const last = dense[dense.length - 1];
	const { r, g, b } = linearToRgbBytes(last.rgbLinear);
	stops.push(`${rgbToHex(r, g, b)} 100%`);
	return `linear-gradient(to right, ${stops.join(", ")})`;
}

// Perceptual lightness (OKLab L), used to order the "By value" tab --
// independent of `position` (the orientation-sweep coordinate the "By
// orientation" tab uses instead).
function lightnessOf(stop: MaterialRampStop): number {
	return rgbLinearToOklab(rgbBytesToLinear(stop.color)).L;
}

export function MaterialRampPreview({
	dense,
	stops,
}: MaterialRampPreviewProps): JSX.Element {
	const [mode, setMode] = useState<PreviewMode>("value");

	const valueOrderedStops = [...stops].sort(
		(a, b) => lightnessOf(a) - lightnessOf(b)
	);

	return (
		<div className="material-ramp-dialog__preview">
			<div className="endpoint-picker__mode-toggle">
				<Button
					className={
						mode === "value"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => setMode("value")}
				>
					By value
				</Button>
				<Button
					className={
						mode === "orientation"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => setMode("orientation")}
				>
					By orientation
				</Button>
			</div>

			{mode === "value" ? (
				<div className="material-ramp-dialog__value-preview">
					{valueOrderedStops.map((stop, index) => {
						const hex = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
						return (
							<FloatingTooltip key={index} text={hex}>
								<div
									className="material-ramp-dialog__value-swatch"
									style={{ backgroundColor: hex }}
									tabIndex={0}
									aria-label={hex}
								/>
							</FloatingTooltip>
						);
					})}
				</div>
			) : (
				<>
					<div
						className="material-ramp-dialog__gradient"
						style={{ backgroundImage: buildGradient(dense) }}
					/>
					<div className="material-ramp-dialog__stops">
						{stops.map((stop, index) => {
							const hex = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
							const label = `${hex} @ ${(stop.position * 100).toFixed(1)}%`;
							return (
								<FloatingTooltip key={index} text={label}>
									<div
										className="material-ramp-dialog__stop"
										style={{
											left: `${stop.position * 100}%`,
											backgroundColor: hex,
										}}
										tabIndex={0}
										aria-label={label}
									/>
								</FloatingTooltip>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
