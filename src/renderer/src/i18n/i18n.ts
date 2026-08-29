import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, NAMESPACES } from "../../../shared/i18n";
import { resources } from "../../../shared/i18n/resources";

export const i18nReady = window.settingsApi.getSettings().then((settings) =>
	i18next.use(initReactI18next).init({
		resources,
		lng: settings.language,
		fallbackLng: DEFAULT_LANGUAGE,
		ns: NAMESPACES,
		defaultNS: "app",
		interpolation: { escapeValue: false },
	})
);

export default i18next;
