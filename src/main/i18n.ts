import i18next from "i18next";
import { DEFAULT_LANGUAGE } from "../shared/i18n";
import { resources } from "../shared/i18n/resources";

export async function initMainI18n(language: string): Promise<void> {
	await i18next.init({
		resources,
		lng: language,
		fallbackLng: DEFAULT_LANGUAGE,
		ns: ["menu"],
		defaultNS: "menu",
		interpolation: { escapeValue: false },
	});
}

export async function changeMainLanguage(language: string): Promise<void> {
	await i18next.changeLanguage(language);
}

export const t: typeof i18next.t = i18next.t;
