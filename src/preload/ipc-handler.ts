import { ipcMain } from 'electron'
import ElectronStore from './store'

const ipc = ipcMain

export const ipcHandlers = () => {
  console.log(ipc)
  
  ipc.handle('Store-Get', (e, key: string): any | null => {
    return ElectronStore.get(key) || null
  })
  
  ipc.handle('Store-Set', (e, key: string, data: any): void => {
    ElectronStore.set(key, data)
  })
  
  ipc.handle('Store-Clear', (): void => {
    ElectronStore.clear() 
  })
}

// export default ipcHandlers
