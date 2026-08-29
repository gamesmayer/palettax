import { UpdateInfo } from "../../../../shared/ipc-contract";
import { Modal } from "../Modal/Modal";

interface UpdateModalProps {
	updateInfo: UpdateInfo;
	onDownload: () => void;
	onDismiss: () => void;
}

export function UpdateModal({
	updateInfo,
	onDownload,
	onDismiss,
}: UpdateModalProps): JSX.Element {
	return (
		<Modal
			className="update-modal"
			title="Update Available"
			buttons={[
				{ value: "Later", onClick: onDismiss },
				{ value: "Download", onClick: onDownload },
			]}
			onClose={onDismiss}
		>
			<p className="update-modal__message">
				Palettax {updateInfo.tagName} is available. Download it from GitHub?
			</p>
		</Modal>
	);
}
