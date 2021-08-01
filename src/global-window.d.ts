import { IpcRenderer } from 'electron'
import Store from 'electron-store'

declare global {
  interface Window {
    world: any
  }
}