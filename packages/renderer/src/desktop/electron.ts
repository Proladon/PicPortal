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
  let generation = 0
  const bind = <T extends object>(target: T, captured: number): T =>
    new Proxy(target, {
      get(target, key) {
        const value = Reflect.get(target, key)
        if (typeof value !== 'function') return value
        return (...args: unknown[]) =>
          captured === generation
            ? Reflect.apply(value, target, args)
            : Promise.resolve([null, 'STALE_PROJECT: 專案已切換'])
      },
    })
  const api: DesktopApi = {
    migration: { completed: true, addedProjects: 0 },
    importLegacySettings: async () => null,
    onFileDrop: async () => () => {
      /* Electron uses HTML drop events. */
    },
    onCloseRequested: async () => () => {
      /* Electron keeps its native lifecycle. */
    },
    whenIdle: async () => {
      /* Electron writes use the shared DB queue. */
    },
    captureProject() {
      return {
        database: bind(api.database, generation),
        fileSystem: bind(api.fileSystem, generation),
      }
    },
    initialize: () => Promise.resolve(),
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
      readOnly: false,
      getSourceFolder: () =>
        result(async () => {
          const [folder, error] = await bridge.database.get('mainFolder')
          return [folder || null, error]
        }),
      setSourceFolder: async (path) => {
        const folder = {
          name: path.replace(/\\/g, '/').split('/').pop() || path,
          path,
        }
        const [, error] = await result(() =>
          bridge.database.save('mainFolder', JSON.stringify(folder))
        )
        return error ? [null, error] : [folder, null]
      },
      connect: async (path) => {
        const response = await result<DBData>(() =>
          bridge.database.connect(path)
        )
        if (!response[1]) generation++
        return response
      },
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
      overrideFile: (source, destination, mode = 'move') =>
        result(() => bridge.fileSystem.overrideFile(source, destination, mode)),
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
      startDragging: () => Promise.resolve(),
      getAppVersion: () => bridge.appWindow.getAppVersion(),
      finishClose: async () => {
        await bridge.appWindow.close()
      },
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
  return api
}
