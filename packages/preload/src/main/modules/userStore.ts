import ElectronStore from 'electron-store'
import { ipcMain } from 'electron'

const ipc = ipcMain
const Store = new ElectronStore()

const userStore = () => {
  ipc.handle('Store-Get', (e, key: string) => {
    const res: any = Store.get(key) || null
    return res
  })
  
  ipc.handle('Store-Set', (e, key: string, data: any) => {
    Store.set(key, data)
  })

  ipc.handle('Store-Remove', (e, key: string) => {
    Store.delete(key)
  })
  
  ipc.handle('Store-Clear', () => {
    Store.clear() 
  })
}

export default userStore