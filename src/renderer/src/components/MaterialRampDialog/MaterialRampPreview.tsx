import { useMemo } from "react";
import { rgbToHex } from "../../../../shared/color";
import {
	nearestOklabIndex,
	rgbBytesToLinear,
	rgbLinearToOklab,
} from "../../../../shared/materialRamp/colorSpace";
import {
	nearestStopColors,
	renderMaterialSphere,
	sphereCellsToBytes,
} from "../../../../shared/materialRamp/sphereRender";
import { lightnessOf } from "../../../../shared/materialRamp/stopLightness";
import {
	LightingConfig,
	MaterialDefinition,
	MaterialRampStop,
} from "../../../../shared/materialRamp/types";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";
import { MaterialSphereCanvas } from "./MaterialSphereCanvas";

interface MaterialRampPreviewProps {
	stops: MaterialRampStop[];
	material: MaterialDefinition;
	lighting: LightingConfig;
}

// The continuous sphere is a smooth HD reference render. The posterized one
// is deliberately low-res -- it's meant to read as a small pixel-art sprite
// ball (scaled up blockily via CSS), showing what the generated stops
// actually look like shading a round form.
const CONTINUOUS_SPHERE_SIZE = 128;
const POSTERIZED_SPHERE_SIZE = 24;

export function MaterialRampPreview({
	stops,
	material,
	lighting,
}: MaterialRampPreviewProps): JSX.Element {
	const valueOrderedStops = [...stops].sort(
		(a, b) => lightnessOf(a) - lightnessOf(b)
	);

	const continuousCells = useMemo(
		() => renderMaterialSphere(material, lighting, CONTINUOUS_SPHERE_SIZE),
		[material, lighting]
	);
	const posterizedCells = useMemo(
		() => renderMaterialSphere(material, lighting, POSTERIZED_SPHERE_SIZE),
		[material, lighting]
	);
	const continuousPixels = useMemo(
		() => sphereCellsToBytes(continuousCells),
		[continuousCells]
	);
	const posterizedPixels = useMemo(
		() => nearestStopColors(posterizedCells, stops),
		[posterizedCells, stops]
	);

	// Highlights whichever stop is perceptually closest to the material's
	// base color, so it's easy to spot where the picked color landed in the
	// generated ramp at a glance.
	const closestToBaseStop = useMemo(() => {
		if (stops.length === 0) return null;
		const target = rgbLinearToOklab(rgbBytesToLinear(material.baseColor));
		const stopOklab = stops.map((stop) =>
			rgbLinearToOklab(rgbBytesToLinear(stop.color))
		);
		return stops[nearestOklabIndex(target, stopOklab)];
	}, [stops, material]);

	return (
		<div className="material-ramp-dialog__preview">
			<div className="material-ramp-dialog__render-preview">
				<MaterialSphereCanvas
					pixels={continuousPixels}
					size={CONTINUOUS_SPHERE_SIZE}
					label="Continuous"
					pixelated={false}
				/>
				<MaterialSphereCanvas
					pixels={posterizedPixels}
					size={POSTERIZED_SPHERE_SIZE}
					label="Posterized"
					pixelated
				/>
			</div>

			<div className="material-ramp-dialog__value-preview">
				{valueOrderedStops.map((stop, index) => {
					const hex = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
					const isClosestToBase = stop === closestToBaseStop;
					return (
						<FloatingTooltip
							key={index}
							text={isClosestToBase ? `${hex} (closest to base color)` : hex}
						>
							<div
								className={
									isClosestToBase
										? "material-ramp-dialog__value-swatch material-ramp-dialog__value-swatch--base"
										: "material-ramp-dialog__value-swatch"
								}
								style={{ backgroundColor: hex }}
								tabIndex={0}
								aria-label={hex}
							/>
						</FloatingTooltip>
					);
				})}
			</div>
		</div>
	);
}
