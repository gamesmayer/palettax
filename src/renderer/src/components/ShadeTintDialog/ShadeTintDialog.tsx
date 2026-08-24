import { Input, Modal, TitleBar } from "@react95/core";
import { MouseEvent, useState } from "react";
import {
	ColorSystem,
	generateShadesAndTints,
	rgbToHex,
} from "../../../../shared/color";
import { PaletteColor } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import {
	EndpointMode,
	EndpointPicker,
	Rgb,
} from "../ColorPicker/EndpointPicker";

interface ShadeTintDialogProps {
	paletteId: string;
	colors: PaletteColor[];
	colorSystem: ColorSystem;
	onClose: () => void;
}

const MIN_COUNT = 0;
const MAX_COUNT = 20;
const MIN_STEP = 1;
const MAX_STEP = 50;
const DEFAULT_LIGHTNESS_STEP = 10;

function clampCount(value: number): number {
	return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(value)));
}

function clampStep(value: number): number {
	return Math.min(MAX_STEP, Math.max(MIN_STEP, Math.round(value)));
}

export function ShadeTintDialog({
	paletteId,
	colors,
	colorSystem,
	onClose,
}: ShadeTintDialogProps): JSX.Element {
	const addColors = usePaletteStore((state) => state.addColors);
	const insertColorsAroundId = usePaletteStore(
		(state) => state.insertColorsAroundId
	);

	const [mode, setMode] = useState<EndpointMode>(
		colors.length > 0 ? "palette" : "new"
	);
	const [paletteColorId, setPaletteColorId] = useState(colors[0]?.id ?? "");
	const [customRgb, setCustomRgb] = useState<Rgb>(
		colors[0] ?? { r: 255, g: 255, b: 255 }
	);

	const [shadeCount, setShadeCount] = useState(3);
	const [tintCount, setTintCount] = useState(3);
	const [lightnessStep, setLightnessStep] = useState(DEFAULT_LIGHTNESS_STEP);

	const base =
		mode === "palette"
			? (colors.find((color) => color.id === paletteColorId) ?? customRgb)
			: customRgb;
	const { shades, tints } = generateShadesAndTints(
		base,
		shadeCount,
		tintCount,
		lightnessStep
	);
	const preview = [...shades, base, ...tints];

	const baseIsNew = mode === "new";
	const newColorCount = shades.length + tints.length + (baseIsNew ? 1 : 0);

	function handleSubmit(): void {
		if (newColorCount === 0) {
			return;
		}
		const toStored = ({ r, g, b }: Rgb) => ({
			r,
			g,
			b,
			hex: rgbToHex(r, g, b),
		});
		const shadeColors = shades.map(toStored);
		const tintColors = tints.map(toStored);
		if (baseIsNew) {
			addColors(paletteId, [...shadeColors, toStored(base), ...tintColors]);
		} else {
			insertColorsAroundId(paletteId, paletteColorId, shadeColors, tintColors);
		}
		onClose();
	}

	function handleBackdropMouseDown(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	return (
		<div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
			<Modal
				className="shade-tint-dialog"
				title="Add shades/tints"
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={[
					{ value: "Cancel", onClick: onClose },
					{ value: "Add", onClick: handleSubmit },
				]}
			>
				<Modal.Content>
					<EndpointPicker
						label="Color"
						mode={mode}
						onModeChange={setMode}
						colors={colors}
						colorSystem={colorSystem}
						paletteColorId={paletteColorId}
						onPaletteColorChange={setPaletteColorId}
						customRgb={customRgb}
						onCustomRgbChange={setCustomRgb}
					/>

					<div className="shade-tint-dialog__counts">
						<div className="endpoint-picker__field">
							<span className="endpoint-picker__field-label">Shades</span>
							<Input
								type="number"
								min={MIN_COUNT}
								max={MAX_COUNT}
								value={shadeCount}
								onChange={(event) =>
									setShadeCount(clampCount(Number(event.target.value)))
								}
								aria-label="Number of shades"
							/>
						</div>
						<div className="endpoint-picker__field">
							<span className="endpoint-picker__field-label">Tints</span>
							<Input
								type="number"
								min={MIN_COUNT}
								max={MAX_COUNT}
								value={tintCount}
								onChange={(event) =>
									setTintCount(clampCount(Number(event.target.value)))
								}
								aria-label="Number of tints"
							/>
						</div>
						<div className="endpoint-picker__field">
							<span className="endpoint-picker__field-label">
								Lightness step %
							</span>
							<Input
								type="number"
								min={MIN_STEP}
								max={MAX_STEP}
								value={lightnessStep}
								onChange={(event) =>
									setLightnessStep(clampStep(Number(event.target.value)))
								}
								aria-label="Lightness step percentage"
							/>
						</div>
					</div>

					<div className="endpoint-picker__field">
						<span className="endpoint-picker__field-label">
							Preview ({newColorCount} new color{newColorCount === 1 ? "" : "s"}
							)
						</span>
						<div className="shade-tint-dialog__preview">
							{preview.map(({ r, g, b }, index) => (
								<div
									key={index}
									className="shade-tint-dialog__preview-swatch"
									style={{ backgroundColor: rgbToHex(r, g, b) }}
									title={rgbToHex(r, g, b)}
								/>
							))}
						</div>
					</div>
				</Modal.Content>
			</Modal>
		</div>
	);
}
