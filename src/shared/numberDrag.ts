function decimalPlaces(step: number): number {
	const s = step.toString();
	const i = s.indexOf(".");
	return i === -1 ? 0 : s.length - i - 1;
}

/** Converts a horizontal drag distance into a new value, snapped to whole
 * `step` multiples of `startValue` and rounded to `step`'s own decimal
 * precision so repeated drags don't accumulate floating-point noise. */
export function computeDraggedValue(
	startValue: number,
	deltaX: number,
	step: number,
	sensitivity: number
): number {
	const deltaSteps = Math.round(deltaX / sensitivity);
	const factor = 10 ** decimalPlaces(step);
	return Math.round((startValue + deltaSteps * step) * factor) / factor;
}
