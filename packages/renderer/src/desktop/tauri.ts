import { getTauriVersion, getVersion } from '@tauri-apps/api/app'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { DesktopApi, DesktopResult } from './types'
import { DesktopNotImplementedError, desktopErrorMessage } from './errors'

function unavailable(operation: string): never {
  throw new DesktopNotImplementedError(operation)
}

async function unavailableResult<T>(
  operation: string
): Promise<DesktopResult<T>> {
  return [null, desktopErrorMessage(new DesktopNotImplementedError(operation))]
}

async function nativeResult<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<DesktopResult<T>> {
  try {
    return [await invoke<T>(command, args), null]
  } catch (error) {
    return [null, desktopErrorMessage(error)]
  }
}

export function createTauriAdapter(): DesktopApi {
  const window = getCurrentWindow()
  const platform = {
    os: '',
    isWindows: false,
    isMac: false,
    isLinux: false,
    versions: {} as Record<string, string>
  }
  let initialization: Promise<void> | undefined
  let session: string | null = null
  let connection = 0
  const projectResult = <T>(command: string, args: Record<string, unknown>, token: string | null) =>
    nativeResult<T>(command, { ...args, session: token || '' })
  const database = (token: () => string | null): DesktopApi['database'] => ({
    readOnly: false,
    async connect(path) {
      const request = ++connection
      const previous = session
      session = null
      const [response, error] = await nativeResult<{ data: DBData; session: string }>('project_connect', { path })
      if (request !== connection) return [null, 'STALE_PROJECT: 專案已切換']
      if (error || !response) {
        session = previous
        return [null, error || '無法讀取專案']
      }
      session = response.session
      return [response.data, null]
    },
    getSourceFolder: () => projectResult('project_source', {}, token()),
    setSourceFolder: (path) => projectResult('project_set_source', { path }, token()),
    save: (key, data) => projectResult('project_save', { keys: [key], data }, token()),
    deepSave: (keys, data) => projectResult('project_save', {
      keys: Array.isArray(keys) ? keys : keys.match(/[^.[\]]+/g) || [], data
    }, token()),
    slice: (key, index) => projectResult('project_slice', { key, index }, token()),
    get: (key) => projectResult('project_get', { key }, token()),
    pullDockings: (data) => projectResult('project_pull_dockings', { data }, token())
  })
  const fileSystem = (token: () => string | null): DesktopApi['fileSystem'] => ({
    openFolder: () => unavailableResult('開啟資料夾（階段 5）'),
    createFile: (path) => nativeResult('file_create', { path }),
    writeJson: (path, data) => nativeResult('project_create', { path, data }),
    copyFile: (source, destination) => projectResult('file_transfer', { source, destination, moveSource: false, overwrite: false }, token()),
    moveFile: (source, destination) => projectResult('file_transfer', { source, destination, moveSource: true, overwrite: false }, token()),
    overrideFile: async (source, destination, mode = 'move') => {
      const [, error] = await projectResult('file_transfer', { source, destination, moveSource: mode === 'move', overwrite: true }, token())
      return error ? [null, error] : ['ok', null]
    },
    deleteFile: (path) => projectResult('file_delete', { path }, token()),
    checkExist: (path) => projectResult('file_exists', { path }, token())
  })

  return {
    captureProject() {
      const captured = session
      return { database: database(() => captured), fileSystem: fileSystem(() => captured) }
    },
    runtime: 'tauri',
    platform,
    initialize() {
      initialization ||= Promise.all([
        invoke<string>('runtime_platform'),
        getTauriVersion()
      ])
        .then(([os, version]) => {
          Object.assign(platform, {
            os,
            isWindows: os === 'win32',
            isMac: os === 'darwin',
            isLinux: os === 'linux'
          })
          platform.versions.tauri = version
        })
        .catch((error) => {
          initialization = undefined
          throw error
        })
      return initialization
    },
    userStore: {
      get: async () => unavailable('設定與專案清單讀取（階段 5）'),
      set: async () => unavailable('設定與專案清單儲存（階段 5）'),
      remove: async () => unavailable('設定移除（階段 5）'),
      clear: async () => unavailable('設定清除（階段 5）')
    },
    browserDialog: {
      open: (options = {}) => invoke('desktop_open_dialog', { options }),
      save: (options = {}) => invoke('desktop_save_dialog', { options })
    },
    scanner: {
      scanImages: (directory, extensions) =>
        invoke('scan_images', { directory, extensions })
    },
    database: database(() => session),
    fileSystem: fileSystem(() => session),
    appWindow: {
      openExternal: (url) => openUrl(url),
      close: () => window.close(),
      minimum: () => window.minimize(),
      maximum: () => window.toggleMaximize(),
      startDragging: () => window.startDragging(),
      getAppVersion: () => getVersion()
    },
    toImageUrl: (path) => (path ? convertFileSrc(path) : ''),
    getDroppedPaths: () => unavailable('原生檔案拖入（階段 5）')
  }
}
