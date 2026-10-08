import { ipcRenderer } from 'electron'

const appWindow = {
  openExternal(path: string) {
    return ipcRenderer.invoke('Open-External', path)
  },
  close() {
    return ipcRenderer.invoke('Window-Close')
  },

  minimum() {
    return ipcRenderer.invoke('Window-Minimum')
  },

  maximum() {
    return ipcRenderer.invoke('Window-Maximum')
  },

  getAppVersion() {
    const version = ipcRenderer.invoke('Get-App-Version')
    return version
  },
}

export default appWindow
