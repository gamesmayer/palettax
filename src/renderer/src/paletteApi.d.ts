import type {
	EnvironmentApi,
	PaletteApi,
	SettingsApi,
} from "../../preload/index";

declare global {
	interface Window {
		paletteApi: PaletteApi;
		environmentApi: EnvironmentApi;
		settingsApi: SettingsApi;
	}
}

export {};
