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
}

export default appWindow
