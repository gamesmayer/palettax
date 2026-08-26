import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
} from "@floating-ui/dom";
import { Frame, Tooltip } from "@react95/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorSystem, rgbToHex } from "../../../../shared/color";
import { ColorSystemFields } from "./ColorSystemFields";

interface SwatchColorPickerProps {
	label: string;
	tooltip?: string;
	/** Skip rendering the visible label — for use inside a parent that already renders its own label for this field (e.g. EndpointPicker). `label` is still used for the swatch's aria-label. */
	hideLabel?: boolean;
	colorSystem: ColorSystem;
	rgb: { r: number; g: number; b: number };
	onChange: (rgb: { r: number; g: number; b: number }) => void;
}

/**
 * A compact color field: a clickable swatch that opens the full
 * ColorSystemFields picker in an anchored popover, instead of rendering it
 * inline (which takes up a lot of vertical space when several color fields
 * appear in the same form).
 */
export function SwatchColorPicker({
	label,
	tooltip,
	hideLabel,
	colorSystem,
	rgb,
	onChange,
}: SwatchColorPickerProps): JSX.Element {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const swatchRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function handlePointerDown(event: MouseEvent): void {
			const target = event.target as Node;
			if (
				!containerRef.current?.contains(target) &&
				!popoverRef.current?.contains(target)
			) {
				setIsOpen(false);
			}
		}
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") setIsOpen(false);
		}

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	useLayoutEffect(() => {
		if (!isOpen) return;
		const swatch = swatchRef.current;
		const popover = popoverRef.current;
		if (!swatch || !popover) return;

		return autoUpdate(swatch, popover, () => {
			computePosition(swatch, popover, {
				placement: "bottom-start",
				strategy: "fixed",
				middleware: [offset(4), flip(), shift({ padding: 4 })],
			}).then(({ x, y }) => {
				Object.assign(popover.style, { left: `${x}px`, top: `${y}px` });
			});
		});
	}, [isOpen]);

	const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
	const labelSpan = (
		<span className="endpoint-picker__field-label">{label}</span>
	);

	return (
		<div
			className={
				hideLabel
					? "swatch-color-picker"
					: "endpoint-picker__field swatch-color-picker"
			}
			ref={containerRef}
		>
			{!hideLabel &&
				(tooltip ? <Tooltip text={tooltip}>{labelSpan}</Tooltip> : labelSpan)}
			<Frame
				as="button"
				ref={swatchRef}
				className="swatch-color-picker__swatch"
				style={{ backgroundColor: hex }}
				onClick={() => setIsOpen((open) => !open)}
				aria-label={`${label}: ${hex}`}
			/>
			{isOpen &&
				createPortal(
					<Frame ref={popoverRef} className="swatch-color-picker__popover">
						<ColorSystemFields
							colorSystem={colorSystem}
							rgb={rgb}
							onChange={onChange}
						/>
					</Frame>,
					document.body
				)}
		</div>
	);
}
