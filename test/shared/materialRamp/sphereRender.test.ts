import { rgbBytesToLinear } from "../../../src/shared/materialRamp/colorSpace";
import { DEFAULT_LIGHTING } from "../../../src/shared/materialRamp/lightingConstants";
import {
	computeViewBasis,
	nearestStopColors,
	renderMaterialCube,
	renderMaterialSphere,
} from "../../../src/shared/materialRamp/sphereRender";
import { dot3 } from "../../../src/shared/materialRamp/vec3";

function isUnit(v: readonly [number, number, number]): boolean {
	return Math.abs(Math.sqrt(dot3(v, v)) - 1) < 1e-9;
}

describe("computeViewBasis", () => {
	it("returns an orthonormal set for the default viewDir", () => {
		const basis = computeViewBasis(DEFAULT_LIGHTING.viewDir);
		expect(isUnit(basis.right)).toBe(true);
		expect(isUnit(basis.up)).toBe(true);
		expect(isUnit(basis.forward)).toBe(true);
		expect(dot3(basis.right, basis.up)).toBeCloseTo(0, 10);
		expect(dot3(basis.right, basis.forward)).toBeCloseTo(0, 10);
		expect(dot3(basis.up, basis.forward)).toBeCloseTo(0, 10);
	});

	it("stays orthonormal (no NaNs) when viewDir is parallel to world-up", () => {
		const basis = computeViewBasis([0, 1, 0]);
		expect(isUnit(basis.right)).toBe(true);
		expect(isUnit(basis.up)).toBe(true);
		expect(isUnit(basis.forward)).toBe(true);
		expect(dot3(basis.right, basis.up)).toBeCloseTo(0, 10);
		expect(dot3(basis.right, basis.forward)).toBeCloseTo(0, 10);
		expect(dot3(basis.up, basis.forward)).toBeCloseTo(0, 10);
	});
});

describe("renderMaterialSphere", () => {
	const material = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 0,
		roughness: 0.5,
	};

	it("is null outside the disk and non-null at the center", () => {
		const size = 8;
		const cells = renderMaterialSphere(material, DEFAULT_LIGHTING, size);
		expect(cells).toHaveLength(size * size);
		expect(cells[0]).toBeNull(); // top-left corner
		const centerIndex = Math.floor(size / 2) * size + Math.floor(size / 2);
		expect(cells[centerIndex]).not.toBeNull();
	});
});

describe("renderMaterialCube", () => {
	const material = {
		baseColor: { r: 180, g: 120, b: 90 },
		metallic: 0,
		roughness: 0.5,
	};

	it("is null at the corners and non-null in the middle", () => {
		const size = 32;
		const cells = renderMaterialCube(material, DEFAULT_LIGHTING, size);
		expect(cells).toHaveLength(size * size);
		expect(cells[0]).toBeNull(); // top-left corner
		const centerIndex = Math.floor(size / 2) * size + Math.floor(size / 2);
		expect(cells[centerIndex]).not.toBeNull();
	});

	it("shades the top face differently from the side walls", () => {
		const size = 32;
		const cells = renderMaterialCube(material, DEFAULT_LIGHTING, size);
		const cx = Math.floor(size / 2);
		const topCell = cells[Math.floor(size * 0.2) * size + cx];
		const wallCell = cells[Math.floor(size * 0.8) * size + cx];
		expect(topCell).not.toBeNull();
		expect(wallCell).not.toBeNull();
		expect(topCell).not.toEqual(wallCell);
	});
});

describe("nearestStopColors", () => {
	it("picks the exact matching stop when a cell's color coincides with it", () => {
		const stops = [
			{ position: 0, color: { r: 10, g: 10, b: 10 } },
			{ position: 0.5, color: { r: 120, g: 60, b: 200 } },
			{ position: 1, color: { r: 255, g: 255, b: 255 } },
		];
		const cells = [{ rgbLinear: rgbBytesToLinear(stops[1].color) }, null];
		const result = nearestStopColors(cells, stops);
		expect(result[0]).toEqual(stops[1].color);
		expect(result[1]).toBeNull();
	});
});
