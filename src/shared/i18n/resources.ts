import commonEn from "./locales/en/common.json";
import menuEn from "./locales/en/menu.json";
import appEn from "./locales/en/app.json";
import helpEn from "./locales/en/help.json";
import commonEs from "./locales/es/common.json";
import menuEs from "./locales/es/menu.json";
import appEs from "./locales/es/app.json";
import helpEs from "./locales/es/help.json";

export const resources = {
	en: { common: commonEn, menu: menuEn, app: appEn, help: helpEn },
	es: { common: commonEs, menu: menuEs, app: appEs, help: helpEs },
} as const;
