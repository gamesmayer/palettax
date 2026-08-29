import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { App } from "./App";
import i18n, { i18nReady } from "./i18n/i18n";
import "@react95/core/GlobalStyle";
import "@react95/core/themes/win95.css";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Could not find the #root element");
}

void i18nReady.then(() => {
	createRoot(rootElement).render(
		<I18nextProvider i18n={i18n}>
			<App />
		</I18nextProvider>
	);
});
