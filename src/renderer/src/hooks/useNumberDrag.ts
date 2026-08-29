import { RefObject, useEffect, useRef, useState } from "react";
import { computeDraggedValue } from "../../../shared/numberDrag";

interface UseNumberDragOptions {
	ref: RefObject<HTMLInputElement>;
	value: number;
	step: number;
	disabled?: boolean;
	/** px of horizontal movement per one `step` increment. Default 4. */
	sensitivity?: number;
	/** px of movement below which pointerup is a plain click, not a drag. */
	clickThreshold?: number;
	onChange: (value: number) => void;
}

interface UseNumberDragResult {
	isDragging: boolean;
}

/**
 * Blender/Photoshop-style click-and-drag-to-scrub for a number input: a
 * plain click still focuses/places the caret as normal (nothing happens
 * until the pointer moves past `clickThreshold`), while dragging past that
 * threshold blurs the field and scrubs its value by `step` per
 * `sensitivity` pixels of horizontal movement, for the duration of the drag.
 */
export function useNumberDrag({
	ref,
	value,
	step,
	disabled,
	sensitivity = 4,
	clickThreshold = 3,
	onChange,
}: UseNumberDragOptions): UseNumberDragResult {
	const [isDragging, setIsDragging] = useState(false);

	// Read through refs instead of effect deps -- an effect depending on
	// `value`/`onChange` directly would tear down and re-add the
	// pointermove/pointerup listeners on every value change, breaking the
	// drag after its first pixel of movement.
	const valueRef = useRef(value);
	const stepRef = useRef(step);
	const sensitivityRef = useRef(sensitivity);
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		valueRef.current = value;
	}, [value]);
	useEffect(() => {
		stepRef.current = step;
	}, [step]);
	useEffect(() => {
		sensitivityRef.current = sensitivity;
	}, [sensitivity]);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		const el = ref.current;
		if (!el || disabled) return;

		let drag: { startX: number; startValue: number; dragging: boolean } | null =
			null;

		function endDrag(): void {
			if (drag?.dragging) {
				setIsDragging(false);
				document.body.style.cursor = "";
			}
			drag = null;
		}

		function handlePointerDown(event: PointerEvent): void {
			if (event.button !== 0) return;
			drag = {
				startX: event.clientX,
				startValue: valueRef.current,
				dragging: false,
			};
			el!.setPointerCapture(event.pointerId);
		}

		function handlePointerMove(event: PointerEvent): void {
			if (!drag) return;
			const deltaX = event.clientX - drag.startX;
			if (!drag.dragging) {
				if (Math.abs(deltaX) < clickThreshold) return;
				drag.dragging = true;
				setIsDragging(true);
				document.body.style.cursor = "ew-resize";
				el!.blur();
			}
			onChangeRef.current(
				computeDraggedValue(
					drag.startValue,
					deltaX,
					stepRef.current,
					sensitivityRef.current
				)
			);
		}

		function handlePointerUp(event: PointerEvent): void {
			el!.releasePointerCapture(event.pointerId);
			endDrag();
		}

		el.addEventListener("pointerdown", handlePointerDown);
		el.addEventListener("pointermove", handlePointerMove);
		el.addEventListener("pointerup", handlePointerUp);
		el.addEventListener("pointercancel", handlePointerUp);
		return () => {
			el.removeEventListener("pointerdown", handlePointerDown);
			el.removeEventListener("pointermove", handlePointerMove);
			el.removeEventListener("pointerup", handlePointerUp);
			el.removeEventListener("pointercancel", handlePointerUp);
			endDrag();
		};
	}, [ref, disabled, clickThreshold]);

	return { isDragging };
}
