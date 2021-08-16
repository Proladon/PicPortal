import { ipcMain, dialog } from 'electron'
import fg from 'fast-glob'

const ipc = ipcMain

const browserDialog = () => {
  ipc.handle('Glob', async(e, patterns, options) => {
    const res: any = await fg(patterns, options)
    return res
  })
}

export default browserDialog