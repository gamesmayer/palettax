import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation(["common", "app"]);
	return (
		<Modal
			className="update-modal"
			title={t("app:updateModal.title")}
			buttons={[
				{ value: t("common:later"), onClick: onDismiss },
				{ value: t("common:download"), onClick: onDownload },
			]}
			onClose={onDismiss}
		>
			<p className="update-modal__message">
				{t("app:updateModal.message", { tag: updateInfo.tagName })}
			</p>
		</Modal>
	);
}
