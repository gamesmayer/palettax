import { Tab, Tabs } from "@react95/core";
import { Trans, useTranslation } from "react-i18next";
import { Modal } from "../Modal/Modal";

interface HelpModalProps {
	onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps): JSX.Element {
	const { t } = useTranslation(["common", "help"]);
	return (
		<Modal
			className="help-modal"
			title={t("help:title")}
			buttons={[{ value: t("common:close"), onClick: onClose }]}
			onClose={onClose}
		>
			<Tabs defaultActiveTab={t("help:tabs.palettes")}>
				<Tab title={t("help:tabs.palettes")}>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:palettes.tabsTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:palettes.tabsBody")}
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:palettes.groupsTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:palettes.groupsBody")}
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:palettes.colorsTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:palettes.colorsBody")}
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:palettes.colorSystemsTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:palettes.colorSystemsBody")}
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:palettes.undoRedoTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:palettes.undoRedoBody")}
						</p>
					</div>
				</Tab>
				<Tab title={t("help:tabs.importExport")}>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:importExport.supportedFormatsTitle")}
						</div>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.pal"
								components={{ strong: <strong /> }}
							/>
						</p>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.gpl"
								components={{ strong: <strong /> }}
							/>
						</p>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.txt"
								components={{ strong: <strong /> }}
							/>
						</p>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.css"
								components={{ strong: <strong /> }}
							/>
						</p>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.ase"
								components={{ strong: <strong /> }}
							/>
						</p>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.aco"
								components={{ strong: <strong /> }}
							/>
						</p>
						<p className="help-modal__section-body">
							<Trans
								ns="help"
								i18nKey="importExport.png"
								components={{ strong: <strong /> }}
							/>
						</p>
					</div>
				</Tab>
				<Tab title={t("help:tabs.colorTools")}>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:colorTools.blendTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:colorTools.blendBody")}
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:colorTools.shadesTintsTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:colorTools.shadesTintsBody")}
						</p>
					</div>
					<div className="help-modal__section">
						<div className="help-modal__section-title">
							{t("help:colorTools.materialRampTitle")}
						</div>
						<p className="help-modal__section-body">
							{t("help:colorTools.materialRampBody1")}
						</p>
						<p className="help-modal__section-body">
							{t("help:colorTools.materialRampBody2")}
						</p>
						<p className="help-modal__section-body">
							{t("help:colorTools.materialRampBody3")}
						</p>
					</div>
				</Tab>
			</Tabs>
		</Modal>
	);
}
