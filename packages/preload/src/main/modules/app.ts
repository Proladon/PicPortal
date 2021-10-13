import { ipcMain, BrowserWindow, app } from 'electron'

const ipc = ipcMain

const appWindow = () => {
  ipc.handle('Window-Close', (e) => {
    // const win: BrowserWindow = BrowserWindow.getFocusedWindow()
    app.exit()
  })

  ipc.handle('Window-Minimum', (e) => {
    const win: BrowserWindow = BrowserWindow.getFocusedWindow()
    win.minimize()
  })

  ipc.handle('Window-Maximum', (e) => {
    const win: BrowserWindow = BrowserWindow.getFocusedWindow()
    const isMaximized = win.isMaximized()
    if (isMaximized) win.unmaximize()
    else if (!isMaximized) win.maximize()
  })
}

export default appWindow
