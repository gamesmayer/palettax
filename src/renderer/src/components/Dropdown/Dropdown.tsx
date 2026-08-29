import { ChangeEvent, ComponentProps } from "react";
import { Dropdown as R95Dropdown } from "@react95/core";
import { Field } from "../Field/Field";

type DropdownElementProps = Omit<
	ComponentProps<typeof R95Dropdown>,
	"value" | "onChange"
>;

export interface DropdownProps extends DropdownElementProps {
	label?: string;
	tooltip?: string;
	value: string | number;
	onChange: (value: string) => void;
}

export function Dropdown({
	label,
	tooltip,
	value,
	onChange,
	...rest
}: DropdownProps): JSX.Element {
	return (
		<Field label={label} tooltip={tooltip}>
			<R95Dropdown
				value={value}
				onChange={(event: ChangeEvent<HTMLSelectElement>) =>
					onChange(event.target.value)
				}
				{...rest}
			/>
		</Field>
	);
}
