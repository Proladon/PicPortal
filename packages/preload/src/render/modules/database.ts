import { ipcRenderer } from 'electron'

const database = {
  connect(filePath: string) {
    const res = ipcRenderer.invoke('Database-Connect', filePath)
    return res
  },
  save(db: any, key: string, data: any) {
    const res = ipcRenderer.invoke('Database-Save', db, key, data)
    return res
  },
}

export default database
