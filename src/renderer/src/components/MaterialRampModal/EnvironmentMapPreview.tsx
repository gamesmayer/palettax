import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { EnvironmentMap } from "../../../../shared/materialRamp/environmentMap";

interface EnvironmentMapPreviewProps {
	environmentMap: EnvironmentMap | null;
}

export function EnvironmentMapPreview({
	environmentMap,
}: EnvironmentMapPreviewProps): JSX.Element {
	const { t } = useTranslation("app");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const base = environmentMap?.levels[0] ?? null;

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !base || !environmentMap) return;

		const imageData = ctx.createImageData(base.width, base.height);
		for (let i = 0; i < base.width * base.height; i++) {
			imageData.data[i * 4] = environmentMap.srgbBytes[i * 3];
			imageData.data[i * 4 + 1] = environmentMap.srgbBytes[i * 3 + 1];
			imageData.data[i * 4 + 2] = environmentMap.srgbBytes[i * 3 + 2];
			imageData.data[i * 4 + 3] = 255;
		}
		ctx.putImageData(imageData, 0, 0);
	}, [environmentMap, base]);

	if (!base) {
		return <div className="material-ramp-modal__environment-preview" />;
	}

	return (
		<canvas
			ref={canvasRef}
			width={base.width}
			height={base.height}
			className="material-ramp-modal__environment-preview"
			role="img"
			aria-label={t("environmentMapPreview.ariaLabel")}
		/>
	);
}
