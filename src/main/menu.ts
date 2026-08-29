import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from "electron";
import { t } from "./i18n";

export function buildMenu(mainWindow: BrowserWindow): Menu {
	const isMac = process.platform === "darwin";

	const preferencesItem: MenuItemConstructorOptions = {
		label: t("preferences"),
		accelerator: "CmdOrCtrl+,",
		click: () => mainWindow.webContents.send("menu:trigger-preferences"),
	};

	const template: MenuItemConstructorOptions[] = [
		...(isMac
			? [
					{
						label: app.name,
						submenu: [
							{ role: "about" },
							{ type: "separator" },
							preferencesItem,
							{ type: "separator" },
							{ role: "services" },
							{ type: "separator" },
							{ role: "hide" },
							{ role: "hideOthers" },
							{ role: "unhide" },
							{ type: "separator" },
							{ role: "quit" },
						],
					} as MenuItemConstructorOptions,
				]
			: []),
		{
			label: t("file"),
			submenu: [
				...(isMac
					? []
					: [
							preferencesItem,
							{ type: "separator" } as MenuItemConstructorOptions,
						]),
				{
					label: t("newPalette"),
					accelerator: "CmdOrCtrl+N",
					click: () => mainWindow.webContents.send("menu:trigger-new-palette"),
				},
				{ type: "separator" },
				{
					label: t("importPalette"),
					accelerator: "CmdOrCtrl+O",
					click: () => mainWindow.webContents.send("menu:trigger-import"),
				},
				{
					label: t("exportPaletteAs"),
					submenu: [
						{
							label: t("export.pal"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "pal"),
						},
						{
							label: t("export.gpl"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "gpl"),
						},
						{
							label: t("export.txt"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "txt"),
						},
						{
							label: t("export.css"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "css"),
						},
						{
							label: t("export.ase"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "ase"),
						},
						{
							label: t("export.aco"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "aco"),
						},
						{
							label: t("export.png"),
							click: () =>
								mainWindow.webContents.send("menu:trigger-export", "png"),
						},
					],
				},
				{ type: "separator" },
				{ role: isMac ? "close" : "quit" },
			],
		},
		{ role: "editMenu" },
		{ role: "viewMenu" },
		{ role: "windowMenu" },
		{
			label: t("help"),
			submenu: [
				{
					label: t("howItWorks"),
					click: () => mainWindow.webContents.send("menu:trigger-help"),
				},
			],
		},
	];

	return Menu.buildFromTemplate(template);
}
