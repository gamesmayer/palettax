import { evaluateBaseColor } from "./brdf";
import { linearToRgbBytes } from "./colorSpace";
import { LightingConfig } from "./types";

type Rgb = { r: number; g: number; b: number };

const SOLVE_ITERATIONS = 20; // matches color.ts's oklchToRgb convention

/**
 * Binary search over sRGB byte values in [0, 255] rather than an analytic
 * inverse: evaluateBaseColor composes sRGB<->linear conversion, the
 * metallic f0 lerp, the diffuse scale, the direct-light GGX specular lobe,
 * the ambient/environment Fresnel terms, and Reinhard tonemapping, all of
 * which are per-channel-independent pointwise operations with no
 * cross-channel coupling anywhere -- so each output channel is a
 * monotonically non-decreasing function of ONLY the matching input channel,
 * for fixed metallic/roughness/lighting (verified in brdf.test.ts). That
 * guarantees bisection converges to the input byte producing the closest
 * achievable output byte, without needing to invert the composed formula
 * symbolically. The other two candidate channels passed to
 * evaluateBaseColor while solving this one are mathematically irrelevant --
 * filled with 0 rather than a "real" guess so that's visually obvious at
 * each call site.
 */
function solveChannel(
	targetByte: number,
	buildCandidate: (channelValue: number) => Rgb,
	readChannel: (rgb: Rgb) => number,
	metallic: number,
	roughness: number,
	lighting: LightingConfig
): number {
	let lo = 0;
	let hi = 255;
	for (let i = 0; i < SOLVE_ITERATIONS; i++) {
		const mid = (lo + hi) / 2;
		const achievedBytes = linearToRgbBytes(
			evaluateBaseColor(
				{ baseColor: buildCandidate(mid), metallic, roughness },
				lighting
			)
		);
		if (readChannel(achievedBytes) < targetByte) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return (lo + hi) / 2;
}

/**
 * Back-solves the albedo (material.baseColor) that makes evaluateBaseColor
 * produce `target`, for the given metallic, roughness, and lighting.
 * `achieved` is evaluateBaseColor re-evaluated at the final (rounded)
 * albedo -- callers use it to detect an
 * unreachable target (e.g. darker than the ambient floor, or brighter than
 * what albedo=255 can produce under the current lighting): an unreachable
 * target simply makes a channel's search converge to a boundary (0 or 255)
 * whose achieved value doesn't match `target`, with no special-casing
 * needed here.
 */
export function solveAlbedoForTarget(
	target: Rgb,
	metallic: number,
	roughness: number,
	lighting: LightingConfig
): { albedo: Rgb; achieved: Rgb } {
	const solvedR = solveChannel(
		target.r,
		(r) => ({ r, g: 0, b: 0 }),
		(rgb) => rgb.r,
		metallic,
		roughness,
		lighting
	);
	const solvedG = solveChannel(
		target.g,
		(g) => ({ r: 0, g, b: 0 }),
		(rgb) => rgb.g,
		metallic,
		roughness,
		lighting
	);
	const solvedB = solveChannel(
		target.b,
		(b) => ({ r: 0, g: 0, b }),
		(rgb) => rgb.b,
		metallic,
		roughness,
		lighting
	);

	const albedo: Rgb = {
		r: Math.round(solvedR),
		g: Math.round(solvedG),
		b: Math.round(solvedB),
	};
	const achieved = linearToRgbBytes(
		evaluateBaseColor({ baseColor: albedo, metallic, roughness }, lighting)
	);
	return { albedo, achieved };
}
