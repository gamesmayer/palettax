import type { EnvironmentApi, PaletteApi } from "../../preload/index";

declare global {
	interface Window {
		paletteApi: PaletteApi;
		environmentApi: EnvironmentApi;
	}
}

export {};
