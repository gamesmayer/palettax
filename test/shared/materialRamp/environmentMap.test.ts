import { encode } from "fast-png";
import { srgbByteToLinear01 } from "../../../src/shared/materialRamp/colorSpace";
import {
	decodeEnvironmentImage,
	directionToEquirectUv,
	sampleEnvironment,
} from "../../../src/shared/materialRamp/environmentMap";

function buildFixturePng(): Uint8Array {
	// 4x2 image: top row solid red, bottom row solid blue.
	const width = 4;
	const height = 2;
	const data = new Uint8Array(width * height * 3);
	for (let x = 0; x < width; x++) {
		const topOffset = (0 * width + x) * 3;
		data[topOffset] = 255;
		data[topOffset + 1] = 0;
		data[topOffset + 2] = 0;

		const bottomOffset = (1 * width + x) * 3;
		data[bottomOffset] = 0;
		data[bottomOffset + 1] = 0;
		data[bottomOffset + 2] = 255;
	}
	return encode({ width, height, data, depth: 8, channels: 3 });
}

describe("directionToEquirectUv", () => {
	it("maps straight up to v=0 and straight down to v=1", () => {
		expect(directionToEquirectUv([0, 1, 0]).v).toBeCloseTo(0);
		expect(directionToEquirectUv([0, -1, 0]).v).toBeCloseTo(1);
	});

	it("wraps u around the horizon as azimuth sweeps a full turn", () => {
		expect(directionToEquirectUv([0, 0, -1]).u).toBeCloseTo(0.5);
		expect(directionToEquirectUv([1, 0, 0]).u).toBeCloseTo(0.75);
		expect(directionToEquirectUv([-1, 0, 0]).u).toBeCloseTo(0.25);
	});
});

describe("decodeEnvironmentImage", () => {
	it("builds a mip chain from full resolution down to 1x1", () => {
		const env = decodeEnvironmentImage(buildFixturePng());
		expect(env.levels.map((level) => [level.width, level.height])).toEqual([
			[4, 2],
			[2, 1],
			[1, 1],
		]);
	});
});

describe("sampleEnvironment", () => {
	it("samples the top row (facing up) and bottom row (facing down) distinctly", () => {
		const env = decodeEnvironmentImage(buildFixturePng());
		const red = srgbByteToLinear01(255);
		const up = sampleEnvironment(env, [0, 1, 0], 0);
		const down = sampleEnvironment(env, [0, -1, 0], 0);

		expect(up.r).toBeCloseTo(red);
		expect(up.b).toBeCloseTo(0);
		expect(down.r).toBeCloseTo(0);
		expect(down.b).toBeCloseTo(red);
	});

	it("blends toward blurrier mip levels as roughness increases", () => {
		const env = decodeEnvironmentImage(buildFixturePng());
		const sharp = sampleEnvironment(env, [0, 1, 0], 0);
		const blurry = sampleEnvironment(env, [0, 1, 0], 1);

		// The last mip level is 1x1, averaging the whole image (half red, half
		// blue), so a fully-rough lookup should sit roughly halfway between red
		// and blue rather than reading pure red like the sharp lookup does.
		expect(blurry.r).toBeLessThan(sharp.r);
		expect(blurry.b).toBeGreaterThan(sharp.b);
	});
});
