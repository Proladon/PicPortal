import Store from 'electron-store'
import { ipcMain } from 'electron'

const ipc = ipcMain
const ElectronStore = new Store()

const userStore = () => {
  ipc.handle('Store-Get', (e, key: string) => {
    const res: any = ElectronStore.get(key) || null
    return res
  })
  
  ipc.handle('Store-Set', (e, key: string, data: any) => {
    ElectronStore.set(key, data)
  })

  ipc.handle('Store-Remove', (e, key: string) => {
    ElectronStore.delete(key)
  })
  
  ipc.handle('Store-Clear', () => {
    ElectronStore.clear() 
  })
}

export default userStore