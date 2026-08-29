import { Button } from "@react95/core";
import { useMemo, useState } from "react";
import { rgbToHex } from "../../../../shared/color";
import { evaluateNeutralBaseColor } from "../../../../shared/materialRamp/brdf";
import {
	nearestOklabIndex,
	rgbBytesToLinear,
	rgbLinearToOklab,
} from "../../../../shared/materialRamp/colorSpace";
import {
	nearestStopColors,
	renderMaterialCube,
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

type PreviewShape = "sphere" | "cube";

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
	const [shape, setShape] = useState<PreviewShape>("sphere");
	const [hoveredPixel, setHoveredPixel] = useState<{
		r: number;
		g: number;
		b: number;
	} | null>(null);
	const [hoveredSwatchColor, setHoveredSwatchColor] = useState<{
		r: number;
		g: number;
		b: number;
	} | null>(null);
	const renderShape =
		shape === "sphere" ? renderMaterialSphere : renderMaterialCube;

	const valueOrderedStops = [...stops].sort(
		(a, b) => lightnessOf(a) - lightnessOf(b)
	);

	const continuousCells = useMemo(
		() => renderShape(material, lighting, CONTINUOUS_SPHERE_SIZE),
		[renderShape, material, lighting]
	);
	const posterizedCells = useMemo(
		() => renderShape(material, lighting, POSTERIZED_SPHERE_SIZE),
		[renderShape, material, lighting]
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
	// generated ramp at a glance. Matched against
	// evaluateNeutralBaseColor(material, lighting) -- the same rendered
	// appearance solveAlbedo.ts back-solves the albedo toward -- rather than
	// the raw albedo bytes, since stop colors are themselves rendered/shaded
	// values and comparing them to an un-rendered albedo would compare
	// unlike quantities.
	const closestToBaseStop = useMemo(() => {
		if (stops.length === 0) return null;
		const target = rgbLinearToOklab(
			evaluateNeutralBaseColor(material, lighting)
		);
		const stopOklab = stops.map((stop) =>
			rgbLinearToOklab(rgbBytesToLinear(stop.color))
		);
		return stops[nearestOklabIndex(target, stopOklab)];
	}, [stops, material, lighting]);

	return (
		<div className="material-ramp-dialog__preview">
			<div className="endpoint-picker__mode-toggle">
				<Button
					className={
						shape === "sphere"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => setShape("sphere")}
				>
					Sphere
				</Button>
				<Button
					className={
						shape === "cube"
							? "endpoint-picker__mode-btn endpoint-picker__mode-btn--active"
							: "endpoint-picker__mode-btn"
					}
					onClick={() => setShape("cube")}
				>
					Cube
				</Button>
			</div>
			<div className="material-ramp-dialog__render-preview">
				<MaterialSphereCanvas
					pixels={continuousPixels}
					size={CONTINUOUS_SPHERE_SIZE}
					label="Continuous"
					pixelated={false}
					onHoverPixel={setHoveredPixel}
					highlightColor={hoveredSwatchColor}
				/>
				<MaterialSphereCanvas
					pixels={posterizedPixels}
					size={POSTERIZED_SPHERE_SIZE}
					label="Posterized"
					pixelated
					onHoverPixel={setHoveredPixel}
					highlightColor={hoveredSwatchColor}
				/>
			</div>

			<div className="material-ramp-dialog__value-preview">
				{valueOrderedStops.map((stop, index) => {
					const hex = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
					const isClosestToBase = stop === closestToBaseStop;
					const isHovered =
						hoveredPixel !== null &&
						stop.color.r === hoveredPixel.r &&
						stop.color.g === hoveredPixel.g &&
						stop.color.b === hoveredPixel.b;
					const className = [
						"material-ramp-dialog__value-swatch",
						isHovered && "material-ramp-dialog__value-swatch--hovered",
					]
						.filter(Boolean)
						.join(" ");
					return (
						<div
							key={index}
							className="material-ramp-dialog__value-swatch-wrapper"
						>
							<FloatingTooltip text={hex}>
								<div
									className={className}
									style={{ backgroundColor: hex }}
									tabIndex={0}
									aria-label={hex}
									onMouseEnter={() => setHoveredSwatchColor(stop.color)}
									onMouseLeave={() => setHoveredSwatchColor(null)}
									onFocus={() => setHoveredSwatchColor(stop.color)}
									onBlur={() => setHoveredSwatchColor(null)}
								/>
							</FloatingTooltip>
							{isClosestToBase && (
								<span className="material-ramp-dialog__value-swatch-label">
									Base
								</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
