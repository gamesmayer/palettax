import { rgbBytesToLinear, rgbLinearToOklab } from "./colorSpace";
import { MaterialRampStop } from "./types";

// Perceptual lightness (OKLab L), used to order the palette swatch list.
export function lightnessOf(stop: MaterialRampStop): number {
	return rgbLinearToOklab(rgbBytesToLinear(stop.color)).L;
}
