/// <reference lib="webworker" />
import { solveAlbedoForTarget } from "../../../shared/materialRamp/solveAlbedo";
import { LightingConfig } from "../../../shared/materialRamp/types";

export interface SolveAlbedoRequest {
	requestId: number;
	target: { r: number; g: number; b: number };
	metallic: number;
	roughness: number;
	lighting: LightingConfig;
}

export interface SolveAlbedoResponse {
	requestId: number;
	albedo: { r: number; g: number; b: number };
	achieved: { r: number; g: number; b: number };
}

self.onmessage = (event: MessageEvent<SolveAlbedoRequest>) => {
	const { requestId, target, metallic, roughness, lighting } = event.data;
	const { albedo, achieved } = solveAlbedoForTarget(
		target,
		metallic,
		roughness,
		lighting
	);
	const response: SolveAlbedoResponse = { requestId, albedo, achieved };
	self.postMessage(response);
};
