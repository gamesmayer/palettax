import { ComponentProps } from "react";
import { Input } from "@react95/core";
import { Field } from "../Field/Field";

type InputElementProps = Omit<
	ComponentProps<typeof Input>,
	"type" | "value" | "onChange"
>;

export interface TextInputProps extends InputElementProps {
	label?: string;
	tooltip?: string;
	value: string;
	onChange: (value: string) => void;
}

export function TextInput({
	label,
	tooltip,
	value,
	onChange,
	...rest
}: TextInputProps): JSX.Element {
	return (
		<Field label={label} tooltip={tooltip}>
			<Input
				type="text"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				{...rest}
			/>
		</Field>
	);
}
