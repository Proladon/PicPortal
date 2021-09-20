import { ipcRenderer } from 'electron'

const browserDialog = {
  open(options: object) {
    const res = ipcRenderer.invoke('Dialog-Open', options)
    return res
  },

  save(options: object) {
    const res = ipcRenderer.invoke('Dialog-Save', options)
    return res
  },
}

export default browserDialog
