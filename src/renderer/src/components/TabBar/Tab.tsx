import { Button, Frame } from "@react95/core";
import { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { EditableText } from "../EditableText/EditableText";
import { CloseIcon } from "../icons/CloseIcon";

interface TabProps {
	label: string;
	active: boolean;
	onSelect: () => void;
	onClose: () => void;
	onRename: (newLabel: string) => void;
}

export function Tab({
	label,
	active,
	onSelect,
	onClose,
	onRename,
}: TabProps): JSX.Element {
	const { t } = useTranslation("app");
	return (
		<Frame
			as="li"
			className={`tab ${active ? "tab--active" : ""}`}
			onClick={onSelect}
		>
			<EditableText
				value={label}
				onCommit={onRename}
				className="tab__name"
				inputClassName="tab__name-input"
			/>
			<Button
				className="tab__close"
				onClick={(event: MouseEvent<HTMLButtonElement>) => {
					event.stopPropagation();
					onClose();
				}}
				aria-label={t("tab.closeAriaLabel", { name: label })}
			>
				<CloseIcon size="s" />
			</Button>
		</Frame>
	);
}
