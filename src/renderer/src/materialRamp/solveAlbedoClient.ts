import { LightingConfig } from "../../../shared/materialRamp/types";
import { SolveAlbedoRequest, SolveAlbedoResponse } from "./solveAlbedoWorker";

let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, (response: SolveAlbedoResponse) => void>();

function getWorker(): Worker {
	if (!worker) {
		worker = new Worker(new URL("./solveAlbedoWorker.ts", import.meta.url), {
			type: "module",
		});
		worker.onmessage = (event: MessageEvent<SolveAlbedoResponse>) => {
			const resolve = pending.get(event.data.requestId);
			if (resolve) {
				pending.delete(event.data.requestId);
				resolve(event.data);
			}
		};
	}
	return worker;
}

/**
 * Posts a solve request and resolves with the matching response by
 * requestId, ignoring any other in-flight requests. Not using transferables
 * for `lighting.environmentMap`'s typed arrays here -- that same
 * EnvironmentMap object is also reused by the main thread for rendering
 * (generateMaterialRamp), and transferring would detach its buffers there;
 * a structured-clone copy of the (small, mip-chain-sized) arrays is the
 * correct tradeoff.
 */
export function requestSolveAlbedo(
	target: { r: number; g: number; b: number },
	metallic: number,
	roughness: number,
	lighting: LightingConfig
): { requestId: number; result: Promise<SolveAlbedoResponse> } {
	const requestId = nextRequestId++;
	const result = new Promise<SolveAlbedoResponse>((resolve) => {
		pending.set(requestId, resolve);
	});
	const message: SolveAlbedoRequest = {
		requestId,
		target,
		metallic,
		roughness,
		lighting,
	};
	getWorker().postMessage(message);
	return { requestId, result };
}
