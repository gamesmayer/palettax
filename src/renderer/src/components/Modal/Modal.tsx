import { Modal as R95Modal, TitleBar } from "@react95/core";
import { ComponentProps, MouseEvent, ReactNode, useEffect } from "react";

interface ModalProps {
	title: string;
	className?: string;
	buttons?: ComponentProps<typeof R95Modal>["buttons"];
	onClose: () => void;
	closeOnEscape?: boolean;
	children: ReactNode;
}

export function Modal({
	title,
	className,
	buttons,
	onClose,
	closeOnEscape = true,
	children,
}: ModalProps): JSX.Element {
	useEffect(() => {
		if (!closeOnEscape) return;
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") onClose();
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [closeOnEscape, onClose]);

	function handleBackdropMouseDown(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	return (
		<div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
			<R95Modal
				className={className}
				title={title}
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onClose} />]}
				buttons={buttons}
			>
				<R95Modal.Content className="modal-content">
					{children}
				</R95Modal.Content>
			</R95Modal>
		</div>
	);
}
