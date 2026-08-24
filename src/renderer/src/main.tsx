import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@react95/core/GlobalStyle";
import "@react95/core/themes/win95.css";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Could not find the #root element");
}

createRoot(rootElement).render(<App />);
