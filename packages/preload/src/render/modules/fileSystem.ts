import { ipcRenderer } from 'electron'

const fileSystem = {
  createFile(file: string) {
    const res = ipcRenderer.invoke('Create-File', file)
    return res
  },
  copyFile(filePath: string, destPath: string) {
    const res = ipcRenderer.invoke('Copy-File', filePath, destPath)
    return res
  },
  moveFile(filePath: string, destPath: string) {
    const res = ipcRenderer.invoke('Move-File', filePath, destPath)
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
  wraping() {
    const res = ipcRenderer.invoke('Wraping')
    return res
  },
}

export default fileSystem
