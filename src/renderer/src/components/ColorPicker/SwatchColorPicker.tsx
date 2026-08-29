import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
} from "@floating-ui/dom";
import { Frame } from "@react95/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	ColorSystem,
	formatColorForSystem,
	rgbToHex,
} from "../../../../shared/color";
import { FieldLabel } from "../Field/Field";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";
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
	const swatchRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function handlePointerDown(event: MouseEvent): void {
			const target = event.target as Node;
			if (
				!swatchRef.current?.contains(target) &&
				!popoverRef.current?.contains(target)
			) {
				setIsOpen(false);
			}
		}
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				// Stops the keydown from reaching the enclosing Modal's own
				// Escape handler (attached on `window`) -- Escape should only
				// close this popover, not also close a modal it happens to be
				// nested inside.
				event.stopPropagation();
				setIsOpen(false);
			}
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

	return (
		<div
			className={
				hideLabel ? "swatch-color-picker" : "field swatch-color-picker"
			}
		>
			{!hideLabel && <FieldLabel text={label} tooltip={tooltip} />}
			<FloatingTooltip text={formatColorForSystem(rgb, colorSystem)}>
				{/* display:contents wrapper -- FloatingTooltip needs a single
				    ref-forwarding child to attach hover/focus handlers to, but the
				    swatch button already owns swatchRef (for the popover's own
				    floating-ui anchor), so it can't also be FloatingTooltip's
				    direct child without the two refs colliding. */}
				<span className="swatch-color-picker__swatch-wrapper">
					<Frame
						as="button"
						ref={swatchRef}
						className="swatch-color-picker__swatch"
						style={{ backgroundColor: hex }}
						onClick={() => setIsOpen((open) => !open)}
						aria-label={`${label}: ${formatColorForSystem(rgb, colorSystem)}`}
					/>
				</span>
			</FloatingTooltip>
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
