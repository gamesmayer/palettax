import {
	BASE_COLOR_LIGHTNESS_WARN_HIGH,
	BASE_COLOR_LIGHTNESS_WARN_LOW,
	MAX_STOPS,
	MAX_UNIT,
	MIN_STOPS,
	MIN_UNIT,
} from "./dialogConstants";
import { rgbBytesToLinear, rgbLinearToOklab } from "./colorSpace";

export function clampUnit(value: number): number {
	return Math.min(MAX_UNIT, Math.max(MIN_UNIT, value));
}

// Light/ambient intensity are radiance scalars, not unitless 0-1 material
// parameters -- HDR-style values above 1 are physically meaningful (a bright
// light, an overexposed scene), so only the lower bound is enforced.
export function clampIntensity(value: number): number {
	return Math.max(MIN_UNIT, value);
}

export function clampStopCount(value: number): number {
	return Math.min(MAX_STOPS, Math.max(MIN_STOPS, Math.round(value)));
}

export function warningForBaseColor(rgb: {
	r: number;
	g: number;
	b: number;
}): string | null {
	const lightness = rgbLinearToOklab(rgbBytesToLinear(rgb)).L;
	if (lightness >= BASE_COLOR_LIGHTNESS_WARN_HIGH) {
		return "This base color is very close to white, leaving little room to show highlights — bright stops in the ramp may look nearly identical. Consider picking a less extreme color.";
	}
	if (lightness <= BASE_COLOR_LIGHTNESS_WARN_LOW) {
		return "This base color is very close to black, leaving little room to show shadows — dark stops in the ramp may look nearly identical. Consider picking a less extreme color.";
	}
	return null;
}
