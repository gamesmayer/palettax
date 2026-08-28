import {
	computeSweepBasis,
	normalAtT,
} from "../../../src/shared/materialRamp/orientationSweep";
import { DEFAULT_LIGHTING } from "../../../src/shared/materialRamp/types";
import { dot3, normalize3 } from "../../../src/shared/materialRamp/vec3";

const basis = computeSweepBasis(DEFAULT_LIGHTING);
const V = normalize3(DEFAULT_LIGHTING.viewDir);
const L = normalize3(DEFAULT_LIGHTING.directionalLightDir);
const H = normalize3([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);

function sample(steps: number): number[] {
	const ts: number[] = [];
	for (let i = 0; i <= steps; i++) ts.push(i / steps);
	return ts;
}

describe("computeSweepBasis", () => {
	it("computes phi as the angle between lightDir and viewDir", () => {
		expect(basis.phi).toBeCloseTo(Math.PI / 4, 10);
	});

	it("e1 equals the normalized view direction", () => {
		expect(basis.e1[0]).toBeCloseTo(V[0], 10);
		expect(basis.e1[1]).toBeCloseTo(V[1], 10);
		expect(basis.e1[2]).toBeCloseTo(V[2], 10);
	});
});

describe("normalAtT", () => {
	it("returns a unit vector for every sampled t in [0,1]", () => {
		for (const t of sample(200)) {
			const n = normalAtT(t, basis);
			const len = Math.sqrt(dot3(n, n));
			expect(len).toBeCloseTo(1, 9);
		}
	});

	it("keeps N·V non-negative across the whole domain (never faces away from the camera)", () => {
		for (const t of sample(200)) {
			const n = normalAtT(t, basis);
			expect(dot3(n, V)).toBeGreaterThanOrEqual(-1e-9);
		}
	});

	it("N·L is monotonically non-decreasing across the domain", () => {
		let prev = dot3(normalAtT(0, basis), L);
		for (const t of sample(200).slice(1)) {
			const curr = dot3(normalAtT(t, basis), L);
			expect(curr).toBeGreaterThanOrEqual(prev - 1e-9);
			prev = curr;
		}
	});

	it("N·L is ~0 at t=0 and 1 at t=1", () => {
		expect(dot3(normalAtT(0, basis), L)).toBeCloseTo(0, 9);
		expect(dot3(normalAtT(1, basis), L)).toBeCloseTo(1, 9);
	});

	it("the argmax of N·H occurs strictly inside the domain, not at an endpoint", () => {
		const steps = sample(1000);
		let bestT = 0;
		let bestDot = -Infinity;
		for (const t of steps) {
			const d = dot3(normalAtT(t, basis), H);
			if (d > bestDot) {
				bestDot = d;
				bestT = t;
			}
		}
		expect(bestT).toBeGreaterThan(0.05);
		expect(bestT).toBeLessThan(0.95);
		// analytic prediction: t = 1 - phi/180deg = 0.75 for phi=45deg
		expect(bestT).toBeCloseTo(0.75, 1);
	});
});

describe("Fresnel-constancy regression guard", () => {
	it("VdotH equals cos(phi/2), independent of any normal, for DEFAULT_LIGHTING", () => {
		const VdotH = dot3(V, H);
		expect(VdotH).toBeCloseTo(Math.cos(basis.phi / 2), 10);
	});
});
