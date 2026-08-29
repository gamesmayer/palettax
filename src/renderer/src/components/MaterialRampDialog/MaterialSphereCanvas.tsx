import { MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { rgbToHex } from "../../../../shared/color";

interface MaterialSphereCanvasProps {
	pixels: ({ r: number; g: number; b: number } | null)[] | null;
	size: number;
	label: string;
	// Pixel-art chunky upscale (nearest-neighbor) vs a smooth HD upscale.
	pixelated: boolean;
	// Reports the color under the cursor as the pointer moves, and null on
	// mouse-leave -- lets a parent highlight a matching swatch elsewhere.
	onHoverPixel?: (pixel: { r: number; g: number; b: number } | null) => void;
	// When set, every pixel matching this color exactly is drawn
	// color-inverted, so hovering a swatch elsewhere highlights it here.
	highlightColor?: { r: number; g: number; b: number } | null;
}

interface HoverInfo {
	clientX: number;
	clientY: number;
	hex: string;
}

export function MaterialSphereCanvas({
	pixels,
	size,
	label,
	pixelated,
	onHoverPixel,
	highlightColor,
}: MaterialSphereCanvasProps): JSX.Element {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [hover, setHover] = useState<HoverInfo | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !pixels) return;

		const imageData = ctx.createImageData(size, size);
		for (let i = 0; i < pixels.length; i++) {
			const pixel = pixels[i];
			if (!pixel) continue;
			const isHighlighted =
				!!highlightColor &&
				pixel.r === highlightColor.r &&
				pixel.g === highlightColor.g &&
				pixel.b === highlightColor.b;
			const offset = i * 4;
			imageData.data[offset] = isHighlighted ? 255 - pixel.r : pixel.r;
			imageData.data[offset + 1] = isHighlighted ? 255 - pixel.g : pixel.g;
			imageData.data[offset + 2] = isHighlighted ? 255 - pixel.b : pixel.b;
			imageData.data[offset + 3] = 255;
		}
		ctx.putImageData(imageData, 0, 0);
	}, [pixels, size, highlightColor]);

	function handleMouseMove(event: MouseEvent<HTMLCanvasElement>): void {
		if (!pixels) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const cellX = Math.floor(((event.clientX - rect.left) / rect.width) * size);
		const cellY = Math.floor(((event.clientY - rect.top) / rect.height) * size);
		if (cellX < 0 || cellX >= size || cellY < 0 || cellY >= size) {
			setHover(null);
			onHoverPixel?.(null);
			return;
		}
		const pixel = pixels[cellY * size + cellX];
		if (!pixel) {
			setHover(null);
			onHoverPixel?.(null);
			return;
		}
		setHover({
			clientX: event.clientX,
			clientY: event.clientY,
			hex: rgbToHex(pixel.r, pixel.g, pixel.b),
		});
		onHoverPixel?.(pixel);
	}

	function handleMouseLeave(): void {
		setHover(null);
		onHoverPixel?.(null);
	}

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
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			/>
			<span className="material-ramp-dialog__sphere-label">{label}</span>
			{hover &&
				createPortal(
					<div
						className="floating-tooltip"
						style={{ left: hover.clientX + 12, top: hover.clientY + 12 }}
					>
						{hover.hex}
					</div>,
					document.body
				)}
		</div>
	);
}
