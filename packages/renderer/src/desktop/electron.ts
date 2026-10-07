import type { DesktopApi, DesktopResult } from './types'
import { desktopErrorMessage } from './errors'

async function result<T>(
  operation: () => Promise<[T, unknown]>
): Promise<DesktopResult<T>> {
  try {
    const [value, error] = await operation()
    return error == null ? [value, null] : [null, desktopErrorMessage(error)]
  } catch (error) {
    return [null, desktopErrorMessage(error)]
  }
}

export function createElectronAdapter(
  bridge: Readonly<ElectronApi>
): DesktopApi {
  return {
    runtime: 'electron',
    platform: {
      os: bridge.platform.platform,
      isWindows: bridge.platform.isWindows,
      isMac: bridge.platform.isMac,
      isLinux: bridge.platform.isLinux,
      versions: bridge.platform.versions,
    },
    userStore: {
      get: (key) => bridge.userStore.get(key),
      set: async (key, data) => {
        await bridge.userStore.set(key, data)
      },
      remove: async (key) => {
        await bridge.userStore.remove(key)
      },
      clear: async () => {
        await bridge.userStore.clear()
      },
    },
    browserDialog: {
      async open(options = {}) {
        const { directory, multiple, ...common } = options
        const response = await bridge.browserDialog.open({
          ...common,
          properties: [
            directory ? 'openDirectory' : 'openFile',
            ...(multiple ? ['multiSelections'] : []),
          ],
        })
        return response.canceled || !response.filePaths.length
          ? null
          : response.filePaths
      },
      async save(options = {}) {
        const response = await bridge.browserDialog.save(options)
        return response.canceled || !response.filePath
          ? null
          : response.filePath
      },
    },
    scanner: {
      scanImages: (directory, extensions) =>
        bridge.fastGlob.scanImages(directory, extensions),
    },
    database: {
      connect: (path) => result(() => bridge.database.connect(path)),
      save: (key, data) => result(() => bridge.database.save(key, data)),
      deepSave: (keys, data) =>
        result(() => bridge.database.deepSave(keys, data)),
      slice: (key, index) => result(() => bridge.database.slice(key, index)),
      get: (key) => result(() => bridge.database.get(key)),
      pullDockings: (data) => result(() => bridge.database.pullDockings(data)),
    },
    fileSystem: {
      openFolder: (path) => result(() => bridge.fileSystem.openFolder(path)),
      createFile: (path) => result(() => bridge.fileSystem.createFile(path)),
      copyFile: (source, destination) =>
        result(() => bridge.fileSystem.copyFile(source, destination)),
      moveFile: (source, destination) =>
        result(() => bridge.fileSystem.moveFile(source, destination)),
      deleteFile: (path) => result(() => bridge.fileSystem.deleteFile(path)),
      overrideFile: (source, destination) =>
        result(() => bridge.fileSystem.overrideFile(source, destination)),
      checkExist: (path) => result(() => bridge.fileSystem.checkExist(path)),
      writeJson: (path, data) =>
        result(() => bridge.fileSystem.writeJson(path, data)),
    },
    appWindow: {
      openExternal: async (url) => {
        await bridge.appWindow.openExternal(url)
      },
      close: async () => {
        await bridge.appWindow.close()
      },
      minimum: async () => {
        await bridge.appWindow.minimum()
      },
      maximum: async () => {
        await bridge.appWindow.maximum()
      },
      getAppVersion: () => bridge.appWindow.getAppVersion(),
    },
    toImageUrl: (path) =>
      path
        ? `local-resource://${encodeURI(path)
            .replace(/#/g, '%23')
            .replace(/\?/g, '%3F')}`
        : '',
    getDroppedPaths: (files) =>
      files
        .map((file) => (file as File & { path?: string }).path)
        .filter((path): path is string => Boolean(path)),
  }
}
