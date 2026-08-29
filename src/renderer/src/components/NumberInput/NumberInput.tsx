import { ComponentProps, useRef } from "react";
import { Input } from "@react95/core";
import { Field } from "../Field/Field";
import { useNumberDrag } from "../../hooks/useNumberDrag";

type InputElementProps = Omit<
	ComponentProps<typeof Input>,
	"type" | "value" | "onChange" | "min" | "max"
>;

export interface NumberInputProps extends InputElementProps {
	label?: string;
	tooltip?: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	/** Applied after min/max bounding, before onChange -- e.g. clampUnit,
	 * clampIntensity, clampStopCount, clampByte, or a dialog-local clamp. */
	clamp?: (value: number) => number;
	/** Pixels of horizontal drag per one `step` increment. Default 4. */
	dragSensitivity?: number;
}

function boundToMinMax(raw: number, min?: number, max?: number): number {
	let v = raw;
	if (min !== undefined) v = Math.max(min, v);
	if (max !== undefined) v = Math.min(max, v);
	return v;
}

export function NumberInput({
	label,
	tooltip,
	value,
	onChange,
	clamp,
	dragSensitivity,
	min,
	max,
	step,
	disabled,
	className,
	...rest
}: NumberInputProps): JSX.Element {
	const ref = useRef<HTMLInputElement>(null);

	function commit(raw: number): void {
		const bounded = boundToMinMax(raw, min, max);
		onChange(clamp ? clamp(bounded) : bounded);
	}

	const { isDragging } = useNumberDrag({
		ref,
		value,
		step: typeof step === "number" ? step : 1,
		sensitivity: dragSensitivity,
		disabled,
		onChange: commit,
	});

	return (
		<Field label={label} tooltip={tooltip}>
			<Input
				ref={ref}
				type="number"
				className={
					"number-input" +
					(isDragging ? " number-input--dragging" : "") +
					(className ? ` ${className}` : "")
				}
				value={value}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
				onChange={(event) => commit(Number(event.target.value))}
				{...rest}
			/>
		</Field>
	);
}
