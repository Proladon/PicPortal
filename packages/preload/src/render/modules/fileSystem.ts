import { ipcRenderer } from 'electron'

const fileSystem = {
  createFile(file: string) {
    const res = ipcRenderer.invoke('Create-File', file)
    return res
  },
  checkExist(filePath: string) {
    const res = ipcRenderer.invoke('Check-Exist', filePath)
    return res
  },
  writeJson(filePath: string, data: unknown) {
    const res = ipcRenderer.invoke('Write-Json', filePath, data)
    return res
  },
}

export default fileSystem
