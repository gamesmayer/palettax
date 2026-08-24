import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import { join } from "node:path";
import { registerPaletteFileHandlers } from "./ipc/paletteFileHandlers";
import { registerUpdateHandlers } from "./ipc/updateHandlers";
import { buildMenu } from "./menu";
import { checkForUpdates } from "./updates/checkForUpdates";

app.setName("Palettax");

app.setAboutPanelOptions({
	applicationName: "Palettax",
	applicationVersion: app.getVersion(),
	copyright: `© ${new Date().getFullYear()} Palettax`,
});

const devIconPath = join(__dirname, "../../build/icon.png");

function createWindow(): void {
	const mainWindow = new BrowserWindow({
		width: 1100,
		height: 720,
		show: false,
		...(app.isPackaged ? {} : { icon: devIconPath }),
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
	});

	Menu.setApplicationMenu(buildMenu(mainWindow));

	let allowClose = false;

	function handleConfirmClose(event: Electron.IpcMainEvent): void {
		if (event.sender !== mainWindow.webContents) return;
		allowClose = true;
		mainWindow.close();
	}

	ipcMain.on("app:confirm-close", handleConfirmClose);

	mainWindow.on("close", (event) => {
		if (allowClose) return;
		event.preventDefault();
		mainWindow.webContents.send("app:request-close");
	});

	mainWindow.on("closed", () => {
		ipcMain.removeListener("app:confirm-close", handleConfirmClose);
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
		void checkForUpdates(mainWindow, app.getVersion());
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
	if (rendererUrl) {
		mainWindow.loadURL(rendererUrl);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}

app.whenReady().then(() => {
	if (!app.isPackaged && process.platform === "darwin") {
		app.dock?.setIcon(devIconPath);
	}

	registerPaletteFileHandlers();
	registerUpdateHandlers();
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
