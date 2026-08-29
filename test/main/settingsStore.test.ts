import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let testDir: string;

jest.mock("electron", () => ({
	app: { getPath: jest.fn(() => testDir) },
}));

import { readSettings, writeSettings } from "../../src/main/settingsStore";

describe("settingsStore", () => {
	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "palettax-settings-"));
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("returns the default language when no settings file exists", async () => {
		expect(await readSettings()).toEqual({ language: "en" });
	});

	it("round-trips a written language", async () => {
		await writeSettings({ language: "es" });
		expect(await readSettings()).toEqual({ language: "es" });
	});

	it("falls back to defaults on malformed JSON", async () => {
		await writeFile(join(testDir, "settings.json"), "{not json", "utf-8");
		expect(await readSettings()).toEqual({ language: "en" });
	});
});
