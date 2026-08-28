import {
	decodeEnvironmentImage,
	EnvironmentMap,
} from "../../../shared/materialRamp/environmentMap";
import defaultEnvironmentUrl from "../assets/environment/default-environment.png";

let cached: Promise<EnvironmentMap> | null = null;

/** Lazily fetches and decodes the bundled default environment image, caching the result for the lifetime of the renderer process. */
export function getDefaultEnvironmentMap(): Promise<EnvironmentMap> {
	if (!cached) {
		cached = fetch(defaultEnvironmentUrl)
			.then((response) => response.arrayBuffer())
			.then((buffer) => decodeEnvironmentImage(new Uint8Array(buffer)));
	}
	return cached;
}
