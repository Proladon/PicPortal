import { ipcRenderer } from 'electron'

const browserDialog = {
  open( options: object ) {
    const res = ipcRenderer.invoke("Dialog-Open", options)
    return res
  },
}

export default browserDialog