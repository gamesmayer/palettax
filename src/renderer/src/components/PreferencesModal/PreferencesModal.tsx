import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	SUPPORTED_LANGUAGE_CODES,
	SupportedLanguageCode,
} from "../../../../shared/i18n";
import { Dropdown } from "../Dropdown/Dropdown";
import { Modal } from "../Modal/Modal";

interface PreferencesModalProps {
	onClose: () => void;
}

export function PreferencesModal({
	onClose,
}: PreferencesModalProps): JSX.Element {
	const { t, i18n } = useTranslation(["common", "app"]);
	const [language, setLanguage] = useState<SupportedLanguageCode>(
		i18n.language as SupportedLanguageCode
	);

	const languageLabel = useMemo(
		() =>
			Object.fromEntries(
				SUPPORTED_LANGUAGE_CODES.map((code) => [
					code,
					t(`app:languages.${code}`),
				])
			) as Record<SupportedLanguageCode, string>,
		[t]
	);
	const languageByLabel = useMemo(
		() =>
			Object.fromEntries(
				SUPPORTED_LANGUAGE_CODES.map((code) => [languageLabel[code], code])
			) as Record<string, SupportedLanguageCode>,
		[languageLabel]
	);

	async function handleLanguageChange(label: string): Promise<void> {
		const code = languageByLabel[label];
		await window.settingsApi.setLanguage(code);
		await i18n.changeLanguage(code);
		setLanguage(code);
	}

	return (
		<Modal
			className="preferences-modal"
			title={t("app:preferencesModal.title")}
			buttons={[{ value: t("common:close"), onClick: onClose }]}
			onClose={onClose}
		>
			<Dropdown
				label={t("app:preferencesModal.languageLabel")}
				options={Object.values(languageLabel)}
				value={languageLabel[language]}
				onChange={handleLanguageChange}
			/>
		</Modal>
	);
}
