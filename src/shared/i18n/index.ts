export const NAMESPACES = ["common", "menu", "app", "help"] as const;

export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGE_CODES = ["en", "es"] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];
