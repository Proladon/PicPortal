import { ipcMain } from 'electron'
import fs from 'fs-extra'

const ipc = ipcMain

const fileSystem = () => {
  ipc.handle('Create-File', async (e, file) => {
    try {
      const res: any = await fs.ensureFile(file)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Check-Exist', async (e, path) => {
    try {
      const res: any = await fs.pathExists(path)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })
}

export default fileSystem
