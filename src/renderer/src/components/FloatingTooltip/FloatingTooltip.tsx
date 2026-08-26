import {
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
} from "@floating-ui/dom";
import {
	cloneElement,
	FocusEvent,
	MouseEvent,
	ReactElement,
	Ref,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

interface FloatingTooltipProps {
	text: string;
	children: ReactElement;
}

/**
 * Drop-in alternative to @react95/core's own `<Tooltip text="...">`, styled
 * to match it, but positioned with floating-ui (computePosition/autoUpdate +
 * flip/shift, portaled to document.body) instead of a hardcoded
 * upward-only offset. Use this wherever the trigger might sit near the edge
 * of a scrolling container (react95's Tooltip has no way to reposition
 * itself and gets clipped in that case).
 *
 * `children` must be a single element that accepts a ref (a DOM element or
 * a component that forwards one) -- it's cloned with a ref plus
 * hover/focus handlers merged onto whatever it already has.
 */
export function FloatingTooltip({
	text,
	children,
}: FloatingTooltipProps): JSX.Element {
	const [isOpen, setIsOpen] = useState(false);
	const anchorRef = useRef<HTMLElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!isOpen) return;
		const anchor = anchorRef.current;
		const tooltip = tooltipRef.current;
		if (!anchor || !tooltip) return;

		return autoUpdate(anchor, tooltip, () => {
			computePosition(anchor, tooltip, {
				placement: "bottom",
				strategy: "fixed",
				middleware: [offset(6), flip(), shift({ padding: 4 })],
			}).then(({ x, y }) => {
				Object.assign(tooltip.style, { left: `${x}px`, top: `${y}px` });
			});
		});
	}, [isOpen]);

	const child = children as ReactElement<{
		ref?: Ref<HTMLElement>;
		onMouseEnter?: (event: MouseEvent) => void;
		onMouseLeave?: (event: MouseEvent) => void;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
	}>;

	return (
		<>
			{cloneElement(child, {
				ref: anchorRef,
				onMouseEnter: (event: MouseEvent) => {
					child.props.onMouseEnter?.(event);
					setIsOpen(true);
				},
				onMouseLeave: (event: MouseEvent) => {
					child.props.onMouseLeave?.(event);
					setIsOpen(false);
				},
				onFocus: (event: FocusEvent) => {
					child.props.onFocus?.(event);
					setIsOpen(true);
				},
				onBlur: (event: FocusEvent) => {
					child.props.onBlur?.(event);
					setIsOpen(false);
				},
			})}
			{isOpen &&
				createPortal(
					<div ref={tooltipRef} className="floating-tooltip">
						{text}
					</div>,
					document.body
				)}
		</>
	);
}
