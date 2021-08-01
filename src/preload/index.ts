import { contextBridge } from 'electron'
// import { ipcHandlers } from './ipc-handler'
import rpcHandlers from './rpc-handler'

console.log('preload in')


const worldBridge = {
  store: rpcHandlers.store
}

console.log('world :', worldBridge)

contextBridge.exposeInMainWorld('world', worldBridge)

console.log('done')