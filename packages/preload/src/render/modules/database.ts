import { ipcRenderer } from 'electron'

const database = {
  connect(filePath: string) {
    const res = ipcRenderer.invoke('Database-Connect', filePath)
    return res
  },
  save(key: string, data: any) {
    const res = ipcRenderer.invoke('Database-Save', key, data)
    return res
  },
  deepSave(keys: string | string[], data: any) {
    const res = ipcRenderer.invoke('Database-Deep-Save', keys, data)
    return res
  },
  slice(key: string, index: number) {
    const res = ipcRenderer.invoke('Database-Slice', key, index)
    return res
  },
  get(key: string) {
    const res = ipcRenderer.invoke('Database-Get', key)
    return res
  },
  find(callback: any) {
    console.log('callback', callback)
    const res = ipcRenderer.invoke('Database-Find', callback)
    return res
  },
}

export default database
