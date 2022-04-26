import { contextBridge } from 'electron'
import userStore from './render/modules/userStore'
import browserDialog from './render/modules/browserDialog'
import fastGlob from './render/modules/fastGlob'
import fileSystem from './render/modules/fileSystem'
import database from './render/modules/database'
import appWindow from './render/modules/app'
import platform from './render/modules/platform'

const apiKey = 'electron'
/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api: ElectronApi = {
  versions: process.versions,
  userStore,
  browserDialog,
  fastGlob,
  fileSystem,
  database,
  appWindow,
  platform
}

if (import.meta.env.MODE !== 'test') {
  contextBridge.exposeInMainWorld(apiKey, api)
} else {
  const deepFreeze = (obj: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((prop) => {
        const val = obj[prop]
        if (
          (typeof val === 'object' || typeof val === 'function') &&
          !Object.isFrozen(val)
        ) {
          deepFreeze(val)
        }
      })
    }

    return Object.freeze(obj)
  }

  deepFreeze(api)

  window[apiKey] = api

  // Need for Spectron tests
  window.electronRequire = require
}
