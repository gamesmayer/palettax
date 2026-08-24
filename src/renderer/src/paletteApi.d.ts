import type { PaletteApi } from "../../preload/index";

declare global {
	interface Window {
		paletteApi: PaletteApi;
	}
}

export {};
