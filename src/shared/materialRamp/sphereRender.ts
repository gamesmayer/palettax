import { evaluateMaterial } from "./brdf";
import {
	linearToRgbBytes,
	nearestOklabIndex,
	rgbBytesToLinear,
	rgbLinearToOklab,
} from "./colorSpace";
import {
	LightingConfig,
	MaterialDefinition,
	MaterialRampStop,
	RgbLinear,
	Vec3,
} from "./types";
import { cross3, dot3, normalize3 } from "./vec3";

// Reused by cube rendering below -- half a cube corner (e.g. `right + forward`
// then normalized) reads as "a wall facing right-and-toward-camera", the same
// axis-combination trick as the sphere's `nx*right + ny*up + nz*forward`.
function addVec3(a: Vec3, b: Vec3): Vec3 {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export interface ViewBasis {
	right: Vec3;
	up: Vec3;
	forward: Vec3;
}

const WORLD_UP: Vec3 = [0, 1, 0];
const WORLD_UP_FALLBACK: Vec3 = [1, 0, 0]; // used when viewDir is ~parallel to WORLD_UP

/**
 * Screen-aligned camera basis for rendering a shaded sphere as viewed along
 * `viewDir`. Cross-product construction (not the L-V-plane Gram-Schmidt in
 * orientationSweep.ts, which solves a different problem): `forward` is
 * `viewDir`, `right`/`up` span the plane perpendicular to it, oriented so
 * `right` points screen-right and `up` points screen-up for the default
 * `viewDir=[0,0,1]`.
 */
export function computeViewBasis(viewDir: Vec3): ViewBasis {
	const forward = normalize3(viewDir);
	const worldUp =
		Math.abs(dot3(forward, WORLD_UP)) > 0.999 ? WORLD_UP_FALLBACK : WORLD_UP;
	const right = normalize3(cross3(worldUp, forward));
	const up = cross3(forward, right);
	return { right, up, forward };
}

export type SphereCell = { rgbLinear: RgbLinear } | null; // null = outside the sphere's disk

/**
 * Renders a `size x size` grid of the material's BRDF response over a
 * sphere viewed head-on along `lighting.viewDir` -- one `evaluateMaterial`
 * call per pixel, CPU-only (this is a small preview thumbnail, not the
 * perf-sensitive dense ramp-generation strip). Cells outside the sphere's
 * silhouette are `null` (background). Row-major, `size * size` entries.
 */
export function renderMaterialSphere(
	material: MaterialDefinition,
	lighting: LightingConfig,
	size: number
): SphereCell[] {
	const basis = computeViewBasis(lighting.viewDir);
	const radius = size / 2;
	const cells: SphereCell[] = [];
	for (let py = 0; py < size; py++) {
		const ny = (radius - (py + 0.5)) / radius;
		for (let px = 0; px < size; px++) {
			const nx = (px + 0.5 - radius) / radius;
			const r2 = nx * nx + ny * ny;
			if (r2 > 1) {
				cells.push(null);
				continue;
			}
			const nz = Math.sqrt(1 - r2);
			const normal: Vec3 = [
				nx * basis.right[0] + ny * basis.up[0] + nz * basis.forward[0],
				nx * basis.right[1] + ny * basis.up[1] + nz * basis.forward[1],
				nx * basis.right[2] + ny * basis.up[2] + nz * basis.forward[2],
			];
			cells.push({ rgbLinear: evaluateMaterial(material, lighting, normal) });
		}
	}
	return cells;
}

/**
 * Renders a `size x size` grid of an isometric cube: a flat-shaded top face
 * plus two flat-shaded side walls, one `evaluateMaterial` call per face (not
 * per pixel -- unlike the sphere, every point on a cube face shares the same
 * normal, so there's nothing to gain from re-evaluating per pixel). Cells
 * outside the cube's hexagonal silhouette are `null` (background). Row-major,
 * `size * size` entries, same shape as `renderMaterialSphere`'s output so
 * callers (`sphereCellsToBytes`, `nearestStopColors`) don't need to know
 * which shape produced the cells.
 */
export function renderMaterialCube(
	material: MaterialDefinition,
	lighting: LightingConfig,
	size: number
): SphereCell[] {
	const basis = computeViewBasis(lighting.viewDir);
	const topNormal = basis.up;
	const leftNormal = normalize3(
		addVec3([-basis.right[0], -basis.right[1], -basis.right[2]], basis.forward)
	);
	const rightNormal = normalize3(addVec3(basis.right, basis.forward));

	const topColor = evaluateMaterial(material, lighting, topNormal);
	const leftColor = evaluateMaterial(material, lighting, leftNormal);
	const rightColor = evaluateMaterial(material, lighting, rightNormal);

	// Isometric outline: a 2:1 top-face rhombus (vertices N/E/S/W) sitting
	// above two vertical-walled parallelograms hanging from its W/S/E
	// vertices down to `wallHeight`.
	const halfWidth = size * 0.45;
	const halfHeight = halfWidth * 0.5;
	const wallHeight = halfWidth * 0.85;
	const totalHeight = halfHeight * 2 + wallHeight;
	const topY = (size - totalHeight) / 2;
	const cx = size / 2;
	const midY = topY + halfHeight; // W/E vertices
	const bottomVertexY = topY + halfHeight * 2; // S vertex, top of the walls

	const cells: SphereCell[] = [];
	for (let py = 0; py < size; py++) {
		for (let px = 0; px < size; px++) {
			const dx = px + 0.5 - cx;
			const topU = dx / halfWidth;
			const topV = (py + 0.5 - midY) / halfHeight;
			if (Math.abs(topU) + Math.abs(topV) <= 1) {
				cells.push({ rgbLinear: topColor });
				continue;
			}

			if (dx <= 0) {
				const a = (dx + halfWidth) / halfWidth;
				const b = (py + 0.5 - midY - a * halfHeight) / wallHeight;
				cells.push(
					a >= 0 && a <= 1 && b >= 0 && b <= 1 ? { rgbLinear: leftColor } : null
				);
			} else {
				const a = dx / halfWidth;
				const b = (py + 0.5 - bottomVertexY + a * halfHeight) / wallHeight;
				cells.push(
					a >= 0 && a <= 1 && b >= 0 && b <= 1
						? { rgbLinear: rightColor }
						: null
				);
			}
		}
	}
	return cells;
}

type RgbBytes = MaterialRampStop["color"];

/** Converts each cell's continuous linear response to sRGB bytes, preserving `null` background cells. */
export function sphereCellsToBytes(cells: SphereCell[]): (RgbBytes | null)[] {
	return cells.map((cell) => (cell ? linearToRgbBytes(cell.rgbLinear) : null));
}

/**
 * Quantizes each cell to whichever of `stops` is perceptually closest (OKLab
 * distance) -- the realistic pixel-art workflow: given an N-color ramp, an
 * artist shades by picking whichever ramp swatch best matches the target
 * value at each point. Works anywhere on the sphere, unlike the ramp's 1-D
 * sweep position `t`, which is only defined on the light/view plane.
 */
export function nearestStopColors(
	cells: SphereCell[],
	stops: MaterialRampStop[]
): (RgbBytes | null)[] {
	const stopOklab = stops.map((stop) =>
		rgbLinearToOklab(rgbBytesToLinear(stop.color))
	);
	return cells.map((cell) => {
		if (!cell) return null;
		const target = rgbLinearToOklab(cell.rgbLinear);
		return stops[nearestOklabIndex(target, stopOklab)].color;
	});
}
