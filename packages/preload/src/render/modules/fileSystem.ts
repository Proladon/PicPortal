import { ipcRenderer } from 'electron'

const fileSystem = {
  createFile(file: string) {
    const res = ipcRenderer.invoke('Create-File', file)
    return res
  },
}

export default fileSystem
