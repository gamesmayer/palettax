import { Frame } from "@react95/core";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ColorSystem,
	generateShadesAndTints,
	rgbToHex,
} from "../../../../shared/color";
import { Easing } from "../../../../shared/easing";
import { PaletteGroup } from "../../../../shared/palette-formats";
import { usePaletteStore } from "../../store/paletteStore";
import {
	DEFAULT_ENDPOINT_MODE,
	EndpointMode,
	EndpointPicker,
	Rgb,
} from "../ColorPicker/EndpointPicker";
import { GroupPicker, GroupSelection } from "../ColorPicker/GroupPicker";
import { Dropdown } from "../Dropdown/Dropdown";
import { Field } from "../Field/Field";
import { Modal } from "../Modal/Modal";
import { NumberInput } from "../NumberInput/NumberInput";

interface ShadeTintModalProps {
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

const EASING_ORDER: Easing[] = [
	"linear",
	"ease-in",
	"ease-out",
	"ease-in-out",
	"smootherstep",
];

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

export function ShadeTintModal({
	paletteId,
	groupId,
	groups,
	colorSystem,
	onClose,
}: ShadeTintModalProps): JSX.Element {
	const { t } = useTranslation(["common", "app"]);
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

	const [mode, setMode] = useState<EndpointMode>(DEFAULT_ENDPOINT_MODE);
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
		setMode(DEFAULT_ENDPOINT_MODE);
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

	const easingLabel = useMemo(
		() =>
			Object.fromEntries(
				EASING_ORDER.map((key) => [key, t(`app:shadeTintModal.easing.${key}`)])
			) as Record<Easing, string>,
		[t]
	);
	const easingByLabel = useMemo(
		() =>
			Object.fromEntries(
				EASING_ORDER.map((key) => [easingLabel[key], key])
			) as Record<string, Easing>,
		[easingLabel]
	);

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

	return (
		<Modal
			className="shade-tint-modal"
			title={t("app:shadeTintModal.title")}
			buttons={[
				{ value: t("common:cancel"), onClick: onClose },
				{ value: t("common:add"), onClick: handleSubmit },
			]}
			onClose={onClose}
		>
			<EndpointPicker
				label={t("app:shadeTintModal.colorLabel")}
				mode={mode}
				onModeChange={setMode}
				colors={colors}
				colorSystem={colorSystem}
				paletteColorId={paletteColorId}
				onPaletteColorChange={setPaletteColorId}
				customRgb={customRgb}
				onCustomRgbChange={setCustomRgb}
			/>

			<Dropdown
				label={t("app:shadeTintModal.interpolationLabel")}
				options={Object.values(easingLabel)}
				value={easingLabel[easing]}
				onChange={(label) => setEasing(easingByLabel[label])}
				aria-label={t("app:shadeTintModal.interpolationAriaLabel")}
			/>

			<Frame className="shade-tint-modal__section">
				<div className="shade-tint-modal__section-title">
					{t("app:shadeTintModal.shadesTitle")}
				</div>
				<div className="shade-tint-modal__row">
					<NumberInput
						label={t("app:shadeTintModal.amountLabel")}
						min={MIN_COUNT}
						max={MAX_COUNT}
						value={shadeCount}
						onChange={setShadeCount}
						clamp={clampCount}
						aria-label={t("app:shadeTintModal.shadeCountAriaLabel")}
					/>
					<NumberInput
						label={t("app:shadeTintModal.darknessLabel")}
						min={MIN_LIGHTNESS_SHIFT}
						max={MAX_LIGHTNESS_SHIFT}
						value={shadeDarkness}
						onChange={setShadeDarkness}
						clamp={clampLightnessShift}
						aria-label={t("app:shadeTintModal.shadeDarknessAriaLabel")}
					/>
					<NumberInput
						label={t("app:shadeTintModal.hueShiftLabel")}
						min={MIN_HUE_SHIFT}
						max={MAX_HUE_SHIFT}
						value={shadeHueShift}
						onChange={setShadeHueShift}
						clamp={clampHueShift}
						aria-label={t("app:shadeTintModal.shadeHueShiftAriaLabel")}
					/>
					<NumberInput
						label={t("app:shadeTintModal.chromaShiftLabel")}
						min={MIN_CHROMA_SHIFT}
						max={MAX_CHROMA_SHIFT}
						value={shadeChromaShift}
						onChange={setShadeChromaShift}
						clamp={clampChromaShift}
						aria-label={t("app:shadeTintModal.shadeChromaShiftAriaLabel")}
					/>
				</div>
			</Frame>

			<Frame className="shade-tint-modal__section">
				<div className="shade-tint-modal__section-title">
					{t("app:shadeTintModal.tintsTitle")}
				</div>
				<div className="shade-tint-modal__row">
					<NumberInput
						label={t("app:shadeTintModal.amountLabel")}
						min={MIN_COUNT}
						max={MAX_COUNT}
						value={tintCount}
						onChange={setTintCount}
						clamp={clampCount}
						aria-label={t("app:shadeTintModal.tintCountAriaLabel")}
					/>
					<NumberInput
						label={t("app:shadeTintModal.lightnessLabel")}
						min={MIN_LIGHTNESS_SHIFT}
						max={MAX_LIGHTNESS_SHIFT}
						value={tintLightness}
						onChange={setTintLightness}
						clamp={clampLightnessShift}
						aria-label={t("app:shadeTintModal.tintLightnessAriaLabel")}
					/>
					<NumberInput
						label={t("app:shadeTintModal.hueShiftLabel")}
						min={MIN_HUE_SHIFT}
						max={MAX_HUE_SHIFT}
						value={tintHueShift}
						onChange={setTintHueShift}
						clamp={clampHueShift}
						aria-label={t("app:shadeTintModal.tintHueShiftAriaLabel")}
					/>
					<NumberInput
						label={t("app:shadeTintModal.chromaShiftLabel")}
						min={MIN_CHROMA_SHIFT}
						max={MAX_CHROMA_SHIFT}
						value={tintChromaShift}
						onChange={setTintChromaShift}
						clamp={clampChromaShift}
						aria-label={t("app:shadeTintModal.tintChromaShiftAriaLabel")}
					/>
				</div>
			</Frame>

			<Field
				label={t("app:shadeTintModal.previewLabel", { count: newColorCount })}
			>
				<div className="shade-tint-modal__preview">
					{preview.map(({ r, g, b }, index) => (
						<div
							key={index}
							className="shade-tint-modal__preview-swatch"
							style={{ backgroundColor: rgbToHex(r, g, b) }}
							title={rgbToHex(r, g, b)}
						/>
					))}
				</div>
			</Field>

			<hr className="modal-separator" />
			<GroupPicker
				groups={groups}
				value={groupSelection}
				onChange={handleGroupChange}
			/>
		</Modal>
	);
}
