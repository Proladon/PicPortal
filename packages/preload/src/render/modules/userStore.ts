import { ipcRenderer } from 'electron'

const userStore = {
  get(key: string) {
    const res = ipcRenderer.invoke("Store-Get", key)
    return res
  },

  set(key: string, data: any) {
    ipcRenderer.invoke("Store-Set", key, data)
  },

  remove(key: string) {
    const res = ipcRenderer.invoke("Store-Remove", key)
    return res
  },

  clear() {
    ipcRenderer.invoke("Store-Clear")
  }
}

export default userStore