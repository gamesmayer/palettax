import { Modal } from "../Modal/Modal";

interface ConfirmModalProps {
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmModal({
	title,
	message,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onCancel,
}: ConfirmModalProps): JSX.Element {
	return (
		<Modal
			className="confirm-modal"
			title={title}
			buttons={[
				{ value: cancelLabel, onClick: onCancel },
				{ value: confirmLabel, onClick: onConfirm },
			]}
			onClose={onCancel}
		>
			<p className="confirm-modal__message">{message}</p>
		</Modal>
	);
}
