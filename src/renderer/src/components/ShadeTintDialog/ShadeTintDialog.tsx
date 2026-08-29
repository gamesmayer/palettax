import { Dropdown, Frame, Input, Modal, TitleBar } from "@react95/core";
import { ChangeEvent, MouseEvent, useState } from "react";
import {
	ColorSystem,
	generateShadesAndTints,
	rgbToHex,
} from "../../../../shared/color";
import { Easing } from "../../../../shared/easing";
import { PaletteGroup } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import {
	EndpointMode,
	EndpointPicker,
	Rgb,
} from "../ColorPicker/EndpointPicker";
import { GroupPicker, GroupSelection } from "../ColorPicker/GroupPicker";

interface ShadeTintDialogProps {
	paletteId: string;
	groupId: string;
	groups: PaletteGroup[];
	colorSystem: ColorSystem;
	onClose: () => void;
}

const MIN_COUNT = 0;
const MAX_COUNT = 20;
const MIN_LIGHTNESS_SHIFT = 0;
const MAX_LIGHTNESS_SHIFT = 100;
const MIN_HUE_SHIFT = -180;
const MAX_HUE_SHIFT = 180;
const MIN_CHROMA_SHIFT = -100;
const MAX_CHROMA_SHIFT = 100;
const DEFAULT_LIGHTNESS_SHIFT = 50;

const EASING_LABELS: Record<Easing, string> = {
	linear: "Linear",
	"ease-in": "Ease In",
	"ease-out": "Ease Out",
	"ease-in-out": "Ease In-Out",
	smootherstep: "Smootherstep",
};
const EASING_BY_LABEL: Record<string, Easing> = Object.fromEntries(
	Object.entries(EASING_LABELS).map(([key, label]) => [label, key as Easing])
);

function clampCount(value: number): number {
	return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(value)));
}

function clampLightnessShift(value: number): number {
	return Math.min(
		MAX_LIGHTNESS_SHIFT,
		Math.max(MIN_LIGHTNESS_SHIFT, Math.round(value))
	);
}

function clampHueShift(value: number): number {
	return Math.min(MAX_HUE_SHIFT, Math.max(MIN_HUE_SHIFT, Math.round(value)));
}

function clampChromaShift(value: number): number {
	return Math.min(
		MAX_CHROMA_SHIFT,
		Math.max(MIN_CHROMA_SHIFT, Math.round(value))
	);
}

export function ShadeTintDialog({
	paletteId,
	groupId,
	groups,
	colorSystem,
	onClose,
}: ShadeTintDialogProps): JSX.Element {
	const addColors = usePaletteStore((state) => state.addColors);
	const insertColorsAroundId = usePaletteStore(
		(state) => state.insertColorsAroundId
	);
	const addGroup = usePaletteStore((state) => state.addGroup);

	const [groupSelection, setGroupSelection] = useState<GroupSelection>(
		groups.length > 0
			? { kind: "existing", groupId }
			: { kind: "new", name: "" }
	);
	const colors =
		groupSelection.kind === "existing"
			? (groups.find((group) => group.id === groupSelection.groupId)?.colors ??
				[])
			: [];

	const [mode, setMode] = useState<EndpointMode>(
		colors.length > 0 ? "palette" : "new"
	);
	const [paletteColorId, setPaletteColorId] = useState(colors[0]?.id ?? "");
	const [customRgb, setCustomRgb] = useState<Rgb>(
		colors[0] ?? { r: 255, g: 255, b: 255 }
	);

	function handleGroupChange(nextSelection: GroupSelection): void {
		setGroupSelection(nextSelection);
		const nextColors =
			nextSelection.kind === "existing"
				? (groups.find((group) => group.id === nextSelection.groupId)?.colors ??
					[])
				: [];
		setMode(nextColors.length > 0 ? "palette" : "new");
		setPaletteColorId(nextColors[0]?.id ?? "");
		setCustomRgb(nextColors[0] ?? { r: 255, g: 255, b: 255 });
	}

	const [shadeCount, setShadeCount] = useState(3);
	const [shadeDarkness, setShadeDarkness] = useState(DEFAULT_LIGHTNESS_SHIFT);
	const [shadeHueShift, setShadeHueShift] = useState(0);
	const [shadeChromaShift, setShadeChromaShift] = useState(0);

	const [tintCount, setTintCount] = useState(3);
	const [tintLightness, setTintLightness] = useState(DEFAULT_LIGHTNESS_SHIFT);
	const [tintHueShift, setTintHueShift] = useState(0);
	const [tintChromaShift, setTintChromaShift] = useState(0);

	const [easing, setEasing] = useState<Easing>("linear");

	const base =
		mode === "palette"
			? (colors.find((color) => color.id === paletteColorId) ?? customRgb)
			: customRgb;
	const { shades, tints } = generateShadesAndTints(
		base,
		shadeCount,
		tintCount,
		{
			lightnessShift: shadeDarkness,
			hueShift: shadeHueShift,
			chromaShift: shadeChromaShift,
		},
		{
			lightnessShift: tintLightness,
			hueShift: tintHueShift,
			chromaShift: tintChromaShift,
		},
		easing
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
		const targetGroupId =
			groupSelection.kind === "existing"
				? groupSelection.groupId
				: addGroup(paletteId, groupSelection.name);
		if (baseIsNew) {
			addColors(paletteId, targetGroupId, [
				...shadeColors,
				toStored(base),
				...tintColors,
			]);
		} else {
			insertColorsAroundId(
				paletteId,
				targetGroupId,
				paletteColorId,
				shadeColors,
				tintColors
			);
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
				<Modal.Content className="dialog-content">
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

					<div className="endpoint-picker__field">
						<span className="endpoint-picker__field-label">Interpolation</span>
						<Dropdown
							options={Object.values(EASING_LABELS)}
							value={EASING_LABELS[easing]}
							onChange={(event: ChangeEvent<HTMLSelectElement>) =>
								setEasing(EASING_BY_LABEL[event.target.value])
							}
							aria-label="Interpolation method"
						/>
					</div>

					<Frame className="shade-tint-dialog__section">
						<div className="shade-tint-dialog__section-title">Shades</div>
						<div className="shade-tint-dialog__row">
							<div className="endpoint-picker__field">
								<span className="endpoint-picker__field-label">Amount</span>
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
								<span className="endpoint-picker__field-label">Darkness %</span>
								<Input
									type="number"
									min={MIN_LIGHTNESS_SHIFT}
									max={MAX_LIGHTNESS_SHIFT}
									value={shadeDarkness}
									onChange={(event) =>
										setShadeDarkness(
											clampLightnessShift(Number(event.target.value))
										)
									}
									aria-label="Shade darkness"
								/>
							</div>
							<div className="endpoint-picker__field">
								<span className="endpoint-picker__field-label">
									Hue Shift °
								</span>
								<Input
									type="number"
									min={MIN_HUE_SHIFT}
									max={MAX_HUE_SHIFT}
									value={shadeHueShift}
									onChange={(event) =>
										setShadeHueShift(clampHueShift(Number(event.target.value)))
									}
									aria-label="Shade hue shift"
								/>
							</div>
							<div className="endpoint-picker__field">
								<span className="endpoint-picker__field-label">
									Chroma Shift %
								</span>
								<Input
									type="number"
									min={MIN_CHROMA_SHIFT}
									max={MAX_CHROMA_SHIFT}
									value={shadeChromaShift}
									onChange={(event) =>
										setShadeChromaShift(
											clampChromaShift(Number(event.target.value))
										)
									}
									aria-label="Shade chroma shift"
								/>
							</div>
						</div>
					</Frame>

					<Frame className="shade-tint-dialog__section">
						<div className="shade-tint-dialog__section-title">Tints</div>
						<div className="shade-tint-dialog__row">
							<div className="endpoint-picker__field">
								<span className="endpoint-picker__field-label">Amount</span>
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
									Lightness %
								</span>
								<Input
									type="number"
									min={MIN_LIGHTNESS_SHIFT}
									max={MAX_LIGHTNESS_SHIFT}
									value={tintLightness}
									onChange={(event) =>
										setTintLightness(
											clampLightnessShift(Number(event.target.value))
										)
									}
									aria-label="Tint lightness"
								/>
							</div>
							<div className="endpoint-picker__field">
								<span className="endpoint-picker__field-label">
									Hue Shift °
								</span>
								<Input
									type="number"
									min={MIN_HUE_SHIFT}
									max={MAX_HUE_SHIFT}
									value={tintHueShift}
									onChange={(event) =>
										setTintHueShift(clampHueShift(Number(event.target.value)))
									}
									aria-label="Tint hue shift"
								/>
							</div>
							<div className="endpoint-picker__field">
								<span className="endpoint-picker__field-label">
									Chroma Shift %
								</span>
								<Input
									type="number"
									min={MIN_CHROMA_SHIFT}
									max={MAX_CHROMA_SHIFT}
									value={tintChromaShift}
									onChange={(event) =>
										setTintChromaShift(
											clampChromaShift(Number(event.target.value))
										)
									}
									aria-label="Tint chroma shift"
								/>
							</div>
						</div>
					</Frame>

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

					<hr className="dialog-separator" />
					<GroupPicker
						groups={groups}
						value={groupSelection}
						onChange={handleGroupChange}
					/>
				</Modal.Content>
			</Modal>
		</div>
	);
}
