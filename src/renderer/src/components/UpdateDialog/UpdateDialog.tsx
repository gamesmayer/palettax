import { Modal, TitleBar } from "@react95/core";
import { MouseEvent } from "react";
import { UpdateInfo } from "../../../../shared/ipc-contract";

interface UpdateDialogProps {
	updateInfo: UpdateInfo;
	onDownload: () => void;
	onDismiss: () => void;
}

export function UpdateDialog({
	updateInfo,
	onDownload,
	onDismiss,
}: UpdateDialogProps): JSX.Element {
	function handleBackdropMouseDown(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			onDismiss();
		}
	}

	return (
		<div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
			<Modal
				className="update-dialog"
				title="Update Available"
				hasWindowButton={false}
				titleBarOptions={[<TitleBar.Close key="close" onClick={onDismiss} />]}
				buttons={[
					{ value: "Later", onClick: onDismiss },
					{ value: "Download", onClick: onDownload },
				]}
			>
				<Modal.Content className="dialog-content">
					<p className="update-dialog__message">
						Palettax {updateInfo.tagName} is available. Download it from GitHub?
					</p>
				</Modal.Content>
			</Modal>
		</div>
	);
}
