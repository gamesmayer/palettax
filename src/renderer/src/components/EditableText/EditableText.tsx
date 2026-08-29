import { Input } from "@react95/core";
import { KeyboardEvent, MouseEvent, useState } from "react";

interface EditableTextProps {
	value: string;
	displayValue?: string;
	onCommit: (newValue: string) => void;
	allowEmpty?: boolean;
	placeholder?: string;
	className?: string;
	inputClassName?: string;
	title?: string;
}

export function EditableText({
	value,
	displayValue,
	onCommit,
	allowEmpty = false,
	placeholder,
	className,
	inputClassName,
	title,
}: EditableTextProps): JSX.Element {
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(value);

	function startEditing(event: MouseEvent): void {
		event.stopPropagation();
		setDraft(value);
		setIsEditing(true);
	}

	function commit(): void {
		const trimmed = draft.trim();
		if (allowEmpty) {
			if (trimmed !== value) {
				onCommit(trimmed);
			}
		} else if (trimmed.length > 0 && trimmed !== value) {
			onCommit(trimmed);
		}
		setIsEditing(false);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			commit();
		} else if (event.key === "Escape") {
			setDraft(value);
			setIsEditing(false);
		}
	}

	if (isEditing) {
		return (
			<Input
				className={
					inputClassName
						? `editable-text__input ${inputClassName}`
						: "editable-text__input"
				}
				value={draft}
				autoFocus
				placeholder={placeholder}
				onClick={(event) => event.stopPropagation()}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onKeyDown={handleKeyDown}
			/>
		);
	}

	return (
		<span
			className={
				className
					? `editable-text__display ${className}`
					: "editable-text__display"
			}
			title={title}
			onDoubleClick={startEditing}
		>
			{displayValue ?? value}
		</span>
	);
}
