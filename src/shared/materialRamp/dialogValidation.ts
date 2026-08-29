import { ColorSystem, formatColorForSystem } from "../color";

export type Translate = (
	key: string,
	options?: Record<string, string>
) => string;
import {
	ALBEDO_LIGHTNESS_WARN_HIGH,
	ALBEDO_LIGHTNESS_WARN_LOW,
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

export function warningForAlbedoColor(
	rgb: {
		r: number;
		g: number;
		b: number;
	},
	t: Translate
): string | null {
	const lightness = rgbLinearToOklab(rgbBytesToLinear(rgb)).L;
	if (lightness >= ALBEDO_LIGHTNESS_WARN_HIGH) {
		return t("app:materialRampModal.warnings.albedoNearWhite");
	}
	if (lightness <= ALBEDO_LIGHTNESS_WARN_LOW) {
		return t("app:materialRampModal.warnings.albedoNearBlack");
	}
	return null;
}

export interface UnreachableTargetWarning {
	// "success" -- the target was matched exactly, byte for byte.
	// "warning" -- off by a sliver, most likely just the solver's own
	// byte-rounding/bisection precision floor, not a real physical limit.
	// "error" -- off by more than that floor, meaning no albedo at the
	// current metallic/roughness/lighting can reproduce this target at all
	// (e.g. a target darker than the ambient floor, or brighter than the
	// tonemap ceiling at albedo=255).
	severity: "success" | "warning" | "error";
	message: string;
}

// Both target and achieved are integer sRGB bytes, so an exact match is
// possible and expected in the common case -- any nonzero difference is
// worth surfacing, but only escalates to "error" past this floor.
const UNREACHABLE_TARGET_ERROR_THRESHOLD = 1;

export function warningForUnreachableTarget(
	target: { r: number; g: number; b: number },
	achieved: { r: number; g: number; b: number },
	colorSystem: ColorSystem,
	t: Translate
): UnreachableTargetWarning {
	const maxDiff = Math.max(
		Math.abs(target.r - achieved.r),
		Math.abs(target.g - achieved.g),
		Math.abs(target.b - achieved.b)
	);
	const targetLabel = formatColorForSystem(target, colorSystem);
	if (maxDiff === 0) {
		return {
			severity: "success",
			message: t("app:materialRampModal.warnings.achievableExactly", {
				target: targetLabel,
			}),
		};
	}
	const achievedLabel = formatColorForSystem(achieved, colorSystem);
	if (maxDiff > UNREACHABLE_TARGET_ERROR_THRESHOLD) {
		return {
			severity: "error",
			message: t("app:materialRampModal.warnings.unreachable", {
				target: targetLabel,
				achieved: achievedLabel,
			}),
		};
	}
	return {
		severity: "warning",
		message: t("app:materialRampModal.warnings.imprecise", {
			target: targetLabel,
			achieved: achievedLabel,
		}),
	};
}
