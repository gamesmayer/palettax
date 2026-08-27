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
