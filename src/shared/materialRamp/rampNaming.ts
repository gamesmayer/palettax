import {
	nearestOklabIndex,
	rgbBytesToLinear,
	rgbLinearToOklab,
} from "./colorSpace";
import { lightnessOf } from "./stopLightness";
import { MaterialRampStop } from "./types";

export interface NamedRampStop {
	stop: MaterialRampStop;
	name: string;
}

interface SideNames {
	extreme: string;
	tier: string;
}

const SHADOW_SIDE: SideNames = { extreme: "Deep Shadow", tier: "Shadow" };
const LIGHT_SIDE: SideNames = { extreme: "Highlight", tier: "Light" };

// `side` must be ordered by ascending distance from Base (index 0 =
// adjacent to Base, last index = most extreme). Only the single most
// extreme step gets the "Deep Shadow"/"Highlight" name; the rest get the
// plain tier name, and are only numbered once there's more than one of them
// to disambiguate.
function nameSide(side: MaterialRampStop[], names: SideNames): string[] {
	const k = side.length;
	if (k === 0) return [];
	if (k === 1) return [names.tier];
	return side.map((_, i) => {
		const distance = i + 1; // 1 = adjacent to Base, k = most extreme
		if (distance === k) return names.extreme;
		return k - 1 === 1 ? names.tier : `${names.tier} ${distance}`;
	});
}

/**
 * Assigns default palette names to generated material ramp stops, based on
 * each stop's position relative to the material's base color: the stop
 * perceptually closest to `baseColor` is named "Base", stops darker than it
 * get shadow-tier names, and stops lighter than it get light/highlight-tier
 * names (see nameSide). Returns the stops re-sorted dark-to-light, paired
 * with their names -- the input `stops` order (raw sweep position) is not
 * preserved, since it isn't guaranteed to be monotonic in lightness.
 */
export function assignRampNames(
	stops: MaterialRampStop[],
	baseColor: { r: number; g: number; b: number }
): NamedRampStop[] {
	const sorted = [...stops].sort((a, b) => lightnessOf(a) - lightnessOf(b));
	if (sorted.length === 0) return [];

	const target = rgbLinearToOklab(rgbBytesToLinear(baseColor));
	const sortedOklab = sorted.map((stop) =>
		rgbLinearToOklab(rgbBytesToLinear(stop.color))
	);
	const baseIndex = nearestOklabIndex(target, sortedOklab);

	// The shadow slice is darkest-first (ascending lightness), i.e. farthest
	// from Base first -- reverse to near-to-far before naming, then reverse
	// the resulting names back to match the darkest-first splice order below.
	const shadowNames = [
		...nameSide([...sorted.slice(0, baseIndex)].reverse(), SHADOW_SIDE),
	].reverse();
	// The light slice is already near-to-far (ascending lightness = ascending
	// distance from Base), so it can be named directly.
	const lightNames = nameSide(sorted.slice(baseIndex + 1), LIGHT_SIDE);
	const names = [...shadowNames, "Base", ...lightNames];

	return sorted.map((stop, i) => ({ stop, name: names[i] }));
}
