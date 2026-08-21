import { BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';

export function buildMenu(mainWindow: BrowserWindow): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' } as MenuItemConstructorOptions] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Palette',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:trigger-new-palette')
        },
        { type: 'separator' },
        {
          label: 'Import Palette…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu:trigger-import')
        },
        {
          label: 'Export Palette as',
          submenu: [
            {
              label: 'JASC/Gale (.pal)',
              click: () => mainWindow.webContents.send('menu:trigger-export', 'pal')
            },
            {
              label: 'GIMP Palette (.gpl)',
              click: () => mainWindow.webContents.send('menu:trigger-export', 'gpl')
            }
          ]
        },
        { type: 'separator' },
        { role: isMac ? 'close' : 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ];

  return Menu.buildFromTemplate(template);
}
