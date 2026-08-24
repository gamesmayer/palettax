import { Input } from "@react95/core";
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
	const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
	const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
	const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
	const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

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
				<div className="color-picker__field">
					<span className="color-picker__field-label">Hex</span>
					<Input
						type="text"
						value={hex}
						onChange={(event) => onChange(hexToRgb(event.target.value))}
						aria-label="Hex code"
					/>
				</div>
			)}
			{colorSystem === "rgb" && (
				<div className="color-picker__channels">
					<div className="color-picker__field">
						<span className="color-picker__field-label">R</span>
						<Input
							type="number"
							min={0}
							max={255}
							value={rgb.r}
							onChange={(event) =>
								onChange({ ...rgb, r: clampByte(Number(event.target.value)) })
							}
							aria-label="Red"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">G</span>
						<Input
							type="number"
							min={0}
							max={255}
							value={rgb.g}
							onChange={(event) =>
								onChange({ ...rgb, g: clampByte(Number(event.target.value)) })
							}
							aria-label="Green"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">B</span>
						<Input
							type="number"
							min={0}
							max={255}
							value={rgb.b}
							onChange={(event) =>
								onChange({ ...rgb, b: clampByte(Number(event.target.value)) })
							}
							aria-label="Blue"
						/>
					</div>
				</div>
			)}
			{colorSystem === "hsl" && (
				<div className="color-picker__channels">
					<div className="color-picker__field">
						<span className="color-picker__field-label">H</span>
						<Input
							type="number"
							min={0}
							max={360}
							value={hsl.h}
							onChange={(event) =>
								onChange(hslToRgb(Number(event.target.value), hsl.s, hsl.l))
							}
							aria-label="Hue"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">S</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={hsl.s}
							onChange={(event) =>
								onChange(hslToRgb(hsl.h, Number(event.target.value), hsl.l))
							}
							aria-label="Saturation"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">L</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={hsl.l}
							onChange={(event) =>
								onChange(hslToRgb(hsl.h, hsl.s, Number(event.target.value)))
							}
							aria-label="Lightness"
						/>
					</div>
				</div>
			)}
			{colorSystem === "hsb" && (
				<div className="color-picker__channels">
					<div className="color-picker__field">
						<span className="color-picker__field-label">H</span>
						<Input
							type="number"
							min={0}
							max={360}
							value={hsv.h}
							onChange={(event) =>
								onChange(hsvToRgb(Number(event.target.value), hsv.s, hsv.v))
							}
							aria-label="Hue"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">S</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={hsv.s}
							onChange={(event) =>
								onChange(hsvToRgb(hsv.h, Number(event.target.value), hsv.v))
							}
							aria-label="Saturation"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">B</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={hsv.v}
							onChange={(event) =>
								onChange(hsvToRgb(hsv.h, hsv.s, Number(event.target.value)))
							}
							aria-label="Brightness"
						/>
					</div>
				</div>
			)}
			{colorSystem === "cmyk" && (
				<div className="color-picker__channels">
					<div className="color-picker__field">
						<span className="color-picker__field-label">C</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={cmyk.c}
							onChange={(event) =>
								onChange(
									cmykToRgb(Number(event.target.value), cmyk.m, cmyk.y, cmyk.k)
								)
							}
							aria-label="Cyan"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">M</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={cmyk.m}
							onChange={(event) =>
								onChange(
									cmykToRgb(cmyk.c, Number(event.target.value), cmyk.y, cmyk.k)
								)
							}
							aria-label="Magenta"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">Y</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={cmyk.y}
							onChange={(event) =>
								onChange(
									cmykToRgb(cmyk.c, cmyk.m, Number(event.target.value), cmyk.k)
								)
							}
							aria-label="Yellow"
						/>
					</div>
					<div className="color-picker__field">
						<span className="color-picker__field-label">K</span>
						<Input
							type="number"
							min={0}
							max={100}
							value={cmyk.k}
							onChange={(event) =>
								onChange(
									cmykToRgb(cmyk.c, cmyk.m, cmyk.y, Number(event.target.value))
								)
							}
							aria-label="Key (black)"
						/>
					</div>
				</div>
			)}
		</>
	);
}
