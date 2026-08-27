import { useEffect, useRef } from "react";

interface MaterialSphereCanvasProps {
	pixels: ({ r: number; g: number; b: number } | null)[] | null;
	size: number;
	label: string;
	// Pixel-art chunky upscale (nearest-neighbor) vs a smooth HD upscale.
	pixelated: boolean;
}

export function MaterialSphereCanvas({
	pixels,
	size,
	label,
	pixelated,
}: MaterialSphereCanvasProps): JSX.Element {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !pixels) return;

		const imageData = ctx.createImageData(size, size);
		for (let i = 0; i < pixels.length; i++) {
			const pixel = pixels[i];
			if (!pixel) continue;
			const offset = i * 4;
			imageData.data[offset] = pixel.r;
			imageData.data[offset + 1] = pixel.g;
			imageData.data[offset + 2] = pixel.b;
			imageData.data[offset + 3] = 255;
		}
		ctx.putImageData(imageData, 0, 0);
	}, [pixels, size]);

	return (
		<div className="material-ramp-dialog__sphere">
			<canvas
				ref={canvasRef}
				width={size}
				height={size}
				className={
					pixelated
						? "material-ramp-dialog__sphere-canvas material-ramp-dialog__sphere-canvas--pixelated"
						: "material-ramp-dialog__sphere-canvas"
				}
				role="img"
				aria-label={label}
			/>
			<span className="material-ramp-dialog__sphere-label">{label}</span>
		</div>
	);
}
