import { ipcRenderer } from 'electron'

const appWindow = {
  close() {
    ipcRenderer.invoke('Window-Close')
  },

  minimum() {
    ipcRenderer.invoke('Window-Minimum')
  },

  maximum() {
    ipcRenderer.invoke('Window-Maximum')
  },

  getAppVersion() {
    const version = ipcRenderer.invoke('Get-App-Version')
    return version
  }
}

export default appWindow
