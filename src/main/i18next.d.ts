import "i18next";
import { resources } from "../shared/i18n/resources";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "menu";
		resources: (typeof resources)["en"];
	}
}
