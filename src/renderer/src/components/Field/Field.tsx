import { ReactNode } from "react";
import { FloatingTooltip } from "../FloatingTooltip/FloatingTooltip";

interface FieldLabelProps {
	text: string;
	tooltip?: string;
}

/**
 * The single place a field label is wired to FloatingTooltip -- use this
 * (directly, or via Field/TextInput/NumberInput/Dropdown) instead of
 * react95's own Tooltip, so every labeled control in the app behaves
 * consistently near the edge of a scrolling modal.
 */
export function FieldLabel({ text, tooltip }: FieldLabelProps): JSX.Element {
	const span = <span className="field__label">{text}</span>;
	return tooltip ? (
		<FloatingTooltip text={tooltip}>{span}</FloatingTooltip>
	) : (
		span
	);
}

interface FieldProps {
	label?: string;
	tooltip?: string;
	children: ReactNode;
}

/**
 * Labeled-column wrapper shared by TextInput/NumberInput/Dropdown and by any
 * other labeled control group (button toggles, vector rows, preset chips).
 * When `label` is omitted, renders `children` unwrapped -- for inline/
 * unlabeled uses (e.g. an inline rename input) that don't want the column
 * layout.
 */
export function Field({ label, tooltip, children }: FieldProps): JSX.Element {
	if (!label) return <>{children}</>;
	return (
		<div className="field">
			<FieldLabel text={label} tooltip={tooltip} />
			{children}
		</div>
	);
}
