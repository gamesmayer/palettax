import { useCallback, useRef, useState } from "react";
import { LightingConfig } from "../../../shared/materialRamp/types";
import { requestSolveAlbedo } from "./solveAlbedoClient";

export interface AlbedoSolveResult {
	albedo: { r: number; g: number; b: number };
	achieved: { r: number; g: number; b: number };
}

/** Thrown (and expected to be caught) by callers of `solve` when a newer request superseded this one before it resolved. */
export class StaleSolveError extends Error {}

export function useAlbedoSolver(): {
	isSolving: boolean;
	solve: (
		target: { r: number; g: number; b: number },
		metallic: number,
		roughness: number,
		lighting: LightingConfig
	) => Promise<AlbedoSolveResult>;
} {
	const [isSolving, setIsSolving] = useState(false);
	const latestRequestId = useRef(-1);

	const solve = useCallback(
		async (
			target: { r: number; g: number; b: number },
			metallic: number,
			roughness: number,
			lighting: LightingConfig
		): Promise<AlbedoSolveResult> => {
			const { requestId, result } = requestSolveAlbedo(
				target,
				metallic,
				roughness,
				lighting
			);
			latestRequestId.current = requestId;
			setIsSolving(true);
			const response = await result;
			if (response.requestId !== latestRequestId.current) {
				throw new StaleSolveError();
			}
			setIsSolving(false);
			return { albedo: response.albedo, achieved: response.achieved };
		},
		[]
	);

	return { isSolving, solve };
}
