import { ipcMain, dialog } from 'electron'

const ipc = ipcMain

const browserDialog = () => {
  ipc.handle('Dialog-Open', (e, options) => {
    const res: any = dialog.showOpenDialog(options)
    return res
  })
}

export default browserDialog