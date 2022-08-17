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

  ipc.handle('Copy-File', async (e, filePath: string, destPath: string) => {
    try {
      const exist = await fs.pathExists(destPath)
      if (exist) return [null, 'FILE_EXIST']
      const res: any = await fs.copy(filePath, destPath)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Move-File', async (e, filePath: string, destPath: string) => {
    try {
      const exist = await fs.pathExists(destPath)
      if (exist) return [null, 'FILE_EXIST']
      const res: any = await fs.move(filePath, destPath)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Check-Exist', async (e, filePath) => {
    try {
      const res: any = await fs.pathExists(filePath)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Write-Json', async (e, filePath, data) => {
    try {
      const res: any = await fs.writeJson(filePath, data)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })
}

export default fileSystem
