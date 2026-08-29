import { Vec3 } from "../../../../shared/materialRamp/types";
import { Field } from "../Field/Field";
import { NumberInput } from "../NumberInput/NumberInput";

const AXIS_LABELS = ["X", "Y", "Z"] as const;

interface VectorInputProps {
	label: string;
	tooltip?: string;
	value: Vec3;
	onChange?: (value: Vec3) => void;
	disabled?: boolean;
	step?: number;
}

/** A labeled row of three NumberInputs for an (x, y, z) vector -- read-only
 * (`disabled`, no `onChange`) today for the light/view directions, but built
 * to also support a future editable vector via the same drag-to-scrub
 * NumberInput every other numeric field uses. */
export function VectorInput({
	label,
	tooltip,
	value,
	onChange,
	disabled,
	step,
}: VectorInputProps): JSX.Element {
	function handleAxisChange(index: number, axisValue: number): void {
		if (!onChange) return;
		const next = value.slice() as [number, number, number];
		next[index] = axisValue;
		onChange(next);
	}

	return (
		<Field label={label} tooltip={tooltip}>
			<div className="vector-input">
				{value.map((component, index) => (
					<NumberInput
						key={index}
						value={component}
						step={step}
						disabled={disabled}
						onChange={(axisValue) => handleAxisChange(index, axisValue)}
						aria-label={`${label} ${AXIS_LABELS[index]}`}
					/>
				))}
			</div>
		</Field>
	);
}
