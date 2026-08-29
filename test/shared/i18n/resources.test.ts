import { NAMESPACES } from "../../../src/shared/i18n";
import { resources } from "../../../src/shared/i18n/resources";

function collectKeys(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) return [prefix];
	return Object.entries(value).flatMap(([key, nested]) =>
		collectKeys(nested, prefix ? `${prefix}.${key}` : key)
	);
}

describe("i18n resources", () => {
	it("gives every supported language the same keys per namespace as English", () => {
		for (const namespace of NAMESPACES) {
			const enKeys = collectKeys(resources.en[namespace]).sort();
			for (const language of Object.keys(resources) as (keyof typeof resources)[]) {
				if (language === "en") continue;
				const keys = collectKeys(resources[language][namespace]).sort();
				expect(keys).toEqual(enKeys);
			}
		}
	});
});
