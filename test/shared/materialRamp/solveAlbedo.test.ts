import { DEFAULT_LIGHTING } from "../../../src/shared/materialRamp/lightingConstants";
import { solveAlbedoForTarget } from "../../../src/shared/materialRamp/solveAlbedo";

describe("solveAlbedoForTarget", () => {
	it("round-trips to within 1 byte per channel for a plausible mid-range target", () => {
		// metallic=0 keeps the full diffuse response in play (see
		// evaluateNeutralBaseColor), so this target sits comfortably inside the
		// achievable range under DEFAULT_LIGHTING -- unlike higher-metallic
		// configurations, where dropping the direct-light specular highlight
		// (deliberately, per evaluateNeutralBaseColor's design) can shrink the
		// achievable range below what a mid-range target like this needs; that
		// case is exactly what the "unreachable target" test below covers.
		const target = { r: 180, g: 120, b: 90 };
		const { achieved } = solveAlbedoForTarget(target, 0, 0.5, DEFAULT_LIGHTING);
		expect(Math.abs(achieved.r - target.r)).toBeLessThanOrEqual(1);
		expect(Math.abs(achieved.g - target.g)).toBeLessThanOrEqual(1);
		expect(Math.abs(achieved.b - target.b)).toBeLessThanOrEqual(1);
	});

	it("solves each channel independently -- changing the target's G/B doesn't change the solved albedo's R", () => {
		const a = solveAlbedoForTarget(
			{ r: 150, g: 30, b: 30 },
			0.3,
			0.6,
			DEFAULT_LIGHTING
		);
		const b = solveAlbedoForTarget(
			{ r: 150, g: 220, b: 200 },
			0.3,
			0.6,
			DEFAULT_LIGHTING
		);
		expect(a.albedo.r).toBe(b.albedo.r);
	});

	it("is deterministic across repeated calls", () => {
		const target = { r: 200, g: 60, b: 140 };
		const a = solveAlbedoForTarget(target, 0.2, 0.4, DEFAULT_LIGHTING);
		const b = solveAlbedoForTarget(target, 0.2, 0.4, DEFAULT_LIGHTING);
		expect(a).toEqual(b);
	});

	it("is monotonic: increasing a target channel never decreases the solved albedo's matching channel", () => {
		let prevR = -Infinity;
		for (let r = 0; r <= 255; r += 15) {
			const { albedo } = solveAlbedoForTarget(
				{ r, g: 128, b: 128 },
				0.4,
				0.5,
				DEFAULT_LIGHTING
			);
			expect(albedo.r).toBeGreaterThanOrEqual(prevR);
			prevR = albedo.r;
		}
	});

	it("still distinguishes different targets for a pure metal (metallic=1), whose diffuse albedo is zero", () => {
		const dark = solveAlbedoForTarget(
			{ r: 40, g: 40, b: 40 },
			1,
			0.3,
			DEFAULT_LIGHTING
		);
		const bright = solveAlbedoForTarget(
			{ r: 220, g: 220, b: 220 },
			1,
			0.3,
			DEFAULT_LIGHTING
		);
		expect(bright.albedo.r).toBeGreaterThan(dark.albedo.r);
	});

	it("reports a mismatched 'achieved' for an unreachable target under degenerate (all-zero) lighting, rather than silently returning a wrong match", () => {
		// With no light, no ambient, and no environment map, every albedo
		// evaluates to {0,0,0} (see evaluateNeutralBaseColor's all-zero-lighting
		// test in brdf.test.ts) -- so any nonzero target is unreachable. The
		// search itself has no way to detect this (it just walks toward
		// whichever boundary the always-0 comparison pushes it to); `achieved`
		// re-evaluates at the final albedo and is what actually catches the
		// mismatch, which callers use to show the unreachable-target warning.
		const darkLighting = {
			...DEFAULT_LIGHTING,
			directionalLightIntensity: 0,
			ambientLightIntensity: 0,
			environmentMap: null,
		};
		const { achieved } = solveAlbedoForTarget(
			{ r: 180, g: 120, b: 90 },
			0.5,
			0.5,
			darkLighting
		);
		expect(achieved).toEqual({ r: 0, g: 0, b: 0 });
	});
});
