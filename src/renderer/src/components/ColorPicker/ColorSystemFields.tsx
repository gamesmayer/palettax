import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	HexColorPicker,
	HslColorPicker,
	HsvColorPicker,
	RgbColorPicker,
} from "react-colorful";
import {
	ColorSystem,
	clampByte,
	cmykToRgb,
	hexToRgb,
	hslToRgb,
	hsvToRgb,
	rgbToCmyk,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
} from "../../../../shared/color";
import { NumberInput } from "../NumberInput/NumberInput";
import { TextInput } from "../TextInput/TextInput";

interface ColorSystemFieldsProps {
	colorSystem: ColorSystem;
	rgb: { r: number; g: number; b: number };
	onChange: (rgb: { r: number; g: number; b: number }) => void;
}

export function ColorSystemFields({
	colorSystem,
	rgb,
	onChange,
}: ColorSystemFieldsProps): JSX.Element {
	const { t } = useTranslation("app");
	const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
	const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
	const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
	const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

	// Local draft, decoupled from `hex`: hexToRgb throws on any input that
	// isn't a complete 6-digit hex, which is every intermediate keystroke
	// while typing. A controlled input bound straight to `hex` would revert
	// on each of those, making it impossible to type freely. The draft holds
	// whatever's currently typed and only commits (via onChange) once it
	// parses; it re-syncs to `hex` when the color changes from elsewhere
	// (the swatch picker, RGB fields, etc).
	const [hexDraft, setHexDraft] = useState(hex);
	useEffect(() => {
		setHexDraft(hex);
	}, [hex]);

	function handleHexInput(value: string): void {
		setHexDraft(value);
		try {
			onChange(hexToRgb(value));
		} catch {
			// Incomplete/invalid hex mid-typing -- keep the draft, don't commit.
		}
	}

	return (
		<>
			<div className="color-picker__picker">
				{colorSystem === "hex" && (
					<HexColorPicker
						color={hex}
						onChange={(value) => onChange(hexToRgb(value))}
					/>
				)}
				{colorSystem === "rgb" && (
					<RgbColorPicker
						color={rgb}
						onChange={(value) =>
							onChange({
								r: clampByte(value.r),
								g: clampByte(value.g),
								b: clampByte(value.b),
							})
						}
					/>
				)}
				{colorSystem === "hsl" && (
					<HslColorPicker
						color={hsl}
						onChange={(value) => onChange(hslToRgb(value.h, value.s, value.l))}
					/>
				)}
				{colorSystem === "hsb" && (
					<HsvColorPicker
						color={hsv}
						onChange={(value) => onChange(hsvToRgb(value.h, value.s, value.v))}
					/>
				)}
				{colorSystem === "cmyk" && (
					<div
						className="color-picker__cmyk-preview"
						style={{ backgroundColor: hex }}
					/>
				)}
			</div>

			{colorSystem === "hex" && (
				<TextInput
					label={t("colorSystemFields.hexLabel")}
					value={hexDraft}
					onChange={handleHexInput}
					aria-label={t("colorSystemFields.hexAriaLabel")}
				/>
			)}
			{colorSystem === "rgb" && (
				<div className="color-picker__channels">
					<NumberInput
						label={t("colorSystemFields.rgbRLabel")}
						min={0}
						max={255}
						value={rgb.r}
						onChange={(v) => onChange({ ...rgb, r: clampByte(v) })}
						aria-label={t("colorSystemFields.rgbRAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.rgbGLabel")}
						min={0}
						max={255}
						value={rgb.g}
						onChange={(v) => onChange({ ...rgb, g: clampByte(v) })}
						aria-label={t("colorSystemFields.rgbGAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.rgbBLabel")}
						min={0}
						max={255}
						value={rgb.b}
						onChange={(v) => onChange({ ...rgb, b: clampByte(v) })}
						aria-label={t("colorSystemFields.rgbBAriaLabel")}
					/>
				</div>
			)}
			{colorSystem === "hsl" && (
				<div className="color-picker__channels">
					<NumberInput
						label={t("colorSystemFields.hslHLabel")}
						min={0}
						max={360}
						dragSensitivity={8}
						value={hsl.h}
						onChange={(v) => onChange(hslToRgb(v, hsl.s, hsl.l))}
						aria-label={t("colorSystemFields.hslHAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.hslSLabel")}
						min={0}
						max={100}
						value={hsl.s}
						onChange={(v) => onChange(hslToRgb(hsl.h, v, hsl.l))}
						aria-label={t("colorSystemFields.hslSAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.hslLLabel")}
						min={0}
						max={100}
						value={hsl.l}
						onChange={(v) => onChange(hslToRgb(hsl.h, hsl.s, v))}
						aria-label={t("colorSystemFields.hslLAriaLabel")}
					/>
				</div>
			)}
			{colorSystem === "hsb" && (
				<div className="color-picker__channels">
					<NumberInput
						label={t("colorSystemFields.hsbHLabel")}
						min={0}
						max={360}
						dragSensitivity={8}
						value={hsv.h}
						onChange={(v) => onChange(hsvToRgb(v, hsv.s, hsv.v))}
						aria-label={t("colorSystemFields.hsbHAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.hsbSLabel")}
						min={0}
						max={100}
						value={hsv.s}
						onChange={(v) => onChange(hsvToRgb(hsv.h, v, hsv.v))}
						aria-label={t("colorSystemFields.hsbSAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.hsbBLabel")}
						min={0}
						max={100}
						value={hsv.v}
						onChange={(v) => onChange(hsvToRgb(hsv.h, hsv.s, v))}
						aria-label={t("colorSystemFields.hsbBAriaLabel")}
					/>
				</div>
			)}
			{colorSystem === "cmyk" && (
				<div className="color-picker__channels">
					<NumberInput
						label={t("colorSystemFields.cmykCLabel")}
						min={0}
						max={100}
						value={cmyk.c}
						onChange={(v) => onChange(cmykToRgb(v, cmyk.m, cmyk.y, cmyk.k))}
						aria-label={t("colorSystemFields.cmykCAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.cmykMLabel")}
						min={0}
						max={100}
						value={cmyk.m}
						onChange={(v) => onChange(cmykToRgb(cmyk.c, v, cmyk.y, cmyk.k))}
						aria-label={t("colorSystemFields.cmykMAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.cmykYLabel")}
						min={0}
						max={100}
						value={cmyk.y}
						onChange={(v) => onChange(cmykToRgb(cmyk.c, cmyk.m, v, cmyk.k))}
						aria-label={t("colorSystemFields.cmykYAriaLabel")}
					/>
					<NumberInput
						label={t("colorSystemFields.cmykKLabel")}
						min={0}
						max={100}
						value={cmyk.k}
						onChange={(v) => onChange(cmykToRgb(cmyk.c, cmyk.m, cmyk.y, v))}
						aria-label={t("colorSystemFields.cmykKAriaLabel")}
					/>
				</div>
			)}
		</>
	);
}
