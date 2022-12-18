import { ipcMain, BrowserWindow, app, shell } from 'electron'
import { simpleGit, SimpleGit } from 'simple-git'

const ipc = ipcMain

const appWindow = () => {
  ipc.handle('Open-External', async (e, path) => {
    await shell.openExternal(path)
  })

  ipc.handle('Window-Close', (e) => {
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

  ipc.handle('Get-App-Version', (e) => {
    const git: SimpleGit = simpleGit()
    return git.tag()
  })
}

export default appWindow
