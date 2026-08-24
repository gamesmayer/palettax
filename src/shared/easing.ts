export type Easing =
	"linear" | "ease-in" | "ease-out" | "ease-in-out" | "smootherstep";

const EASING_FUNCTIONS: Record<Easing, (t: number) => number> = {
	linear: (t) => t,
	"ease-in": (t) => t * t,
	"ease-out": (t) => 1 - (1 - t) * (1 - t),
	"ease-in-out": (t) => 3 * t * t - 2 * t * t * t,
	smootherstep: (t) => 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3,
};

export function applyEasing(easing: Easing, t: number): number {
	return EASING_FUNCTIONS[easing](t);
}
