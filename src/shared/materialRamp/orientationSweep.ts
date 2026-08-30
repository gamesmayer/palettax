import { LightingConfig, Vec3 } from "./types";
import { dot3, normalize3 } from "./vec3";

export interface SweepBasis {
	e1: Vec3; // = normalized viewDir
	e2: Vec3; // = component of lightDir orthogonal to viewDir (Gram-Schmidt), normalized
	phi: number; // angle between lightDir and viewDir, radians
}

/**
 * Derives the fixed in-plane basis the orientation sweep rotates N through,
 * from the fixed L/V pair in `lighting`. Degenerates (unstable e2) if L is
 * nearly parallel/antiparallel to V — not a concern for DEFAULT_LIGHTING
 * (phi=45deg), relevant once lighting becomes user-configurable.
 */
export function computeSweepBasis(lighting: LightingConfig): SweepBasis {
	const V = normalize3(lighting.viewDir);
	const L = normalize3(lighting.directionalLightDir);
	const LdotV = Math.min(1, Math.max(-1, dot3(L, V)));
	const phi = Math.acos(LdotV);
	const e1 = V;
	const e2 = normalize3([
		L[0] - LdotV * V[0],
		L[1] - LdotV * V[1],
		L[2] - LdotV * V[2],
	]);
	return { e1, e2, phi };
}

/**
 * Maps ramp sweep position t in [0,1] to a surface normal N(t), sweeping
 * through the L-V plane: alpha(t) = (phi - 90deg) + 90deg*t. At t=0,
 * N·L=0 (grazing to the light, darkest); at t=1, N·L=1 (facing the light,
 * brightest); N·V stays positive throughout (surface always camera-visible);
 * the specular peak (N aligned with the fixed half-vector H) lands at the
 * interior position t = 1 - phi/180deg. See DEFAULT_LIGHTING's comment in
 * lightingConstants.ts for the full derivation and its limits.
 */
export function normalAtT(t: number, basis: SweepBasis): Vec3 {
	const alpha = basis.phi - Math.PI / 2 + (Math.PI / 2) * t;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	return [
		c * basis.e1[0] + s * basis.e2[0],
		c * basis.e1[1] + s * basis.e2[1],
		c * basis.e1[2] + s * basis.e2[2],
	];
}

/**
 * The sweep position t at which normalAtT(t, basis) exactly equals the view
 * direction (N=V, alpha=0) -- inverse of normalAtT's alpha(t) formula. This
 * is the exact sweep point evaluateBaseColor evaluates at (see brdf.ts), so
 * generateMaterialRamp.ts uses it to guarantee one ramp stop exactly matches
 * the material's solved Base color instead of merely approximating it via
 * the nearest sampled grid point. Clamped to [0,1]: only in-range when
 * phi <= 90deg (mirrors normalAtT's own N.V>=0 assumption) -- not reachable
 * today since lightDir/viewDir aren't user-configurable, only relevant if
 * that ever changes.
 */
export function baseT(basis: SweepBasis): number {
	return Math.min(1, Math.max(0, 1 - basis.phi / (Math.PI / 2)));
}
