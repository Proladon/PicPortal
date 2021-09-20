import { ipcRenderer } from 'electron'

const fileSystem = {
  createFile(file: string) {
    const res = ipcRenderer.invoke('Create-File', file)
    return res
  },
  checkExist(path: string) {
    const res = ipcRenderer.invoke('Check-Exist', path)
    return res
  },
}

export default fileSystem
