import { Vec3 } from "./types";

export function dot3(a: Vec3, b: Vec3): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function normalize3(v: Vec3): Vec3 {
	const len = Math.sqrt(dot3(v, v)) || 1;
	return [v[0] / len, v[1] / len, v[2] / len];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0],
	];
}

/** Reflects `v` about `normal` (both expected normalized) -- e.g. the mirror direction a viewer looking along `-v` would see reflected off a surface with this normal. */
export function reflect3(v: Vec3, normal: Vec3): Vec3 {
	const d = 2 * dot3(normal, v);
	return [d * normal[0] - v[0], d * normal[1] - v[1], d * normal[2] - v[2]];
}
