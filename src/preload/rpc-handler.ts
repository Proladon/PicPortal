import { ipcRenderer } from 'electron'


export const rpcHandlers = {
  store: {
    get(key: string) {
      return ipcRenderer.invoke("Store-Get", key)
    },
  
    set(key: string, data: any) {
        return ipcRenderer.invoke("Store-Set", key, data)
    },
  
    clear() {
        return ipcRenderer.invoke("Store-Clear")
    }
  }
}

export default rpcHandlers