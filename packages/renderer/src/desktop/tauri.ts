import { getTauriVersion, getVersion } from '@tauri-apps/api/app'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { openUrl } from '@tauri-apps/plugin-opener'
import type {
  DesktopApi,
  DesktopResult,
  DesktopSettings,
  MigrationStatus,
  NativeFileDrop,
} from './types'
import { desktopErrorMessage } from './errors'
import { reportDesktopError } from './status'

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
    versions: {} as Record<string, string>,
  }
  let initialization: Promise<void> | undefined
  const migration: MigrationStatus = { completed: false, addedProjects: 0 }
  const pending = new Set<Promise<unknown>>()
  const track = <T>(task: Promise<T>): Promise<T> => {
    pending.add(task)
    task.then(
      () => pending.delete(task),
      () => pending.delete(task)
    )
    return task
  }
  const native = <T>(command: string, args?: Record<string, unknown>) =>
    track(invoke<T>(command, args))
  function getStore(key: 'projects'): Promise<Project[] | null>
  function getStore(key: 'settings'): Promise<DesktopSettings | null>
  function getStore(
    key: 'projects' | 'settings'
  ): Promise<Project[] | DesktopSettings | null> {
    return native('preferences_get', { key })
  }
  let session: string | null = null
  let connection = 0
  const projectResult = <T>(
    command: string,
    args: Record<string, unknown>,
    token: string | null
  ) => track(nativeResult<T>(command, { ...args, session: token || '' }))
  const database = (token: () => string | null): DesktopApi['database'] => ({
    readOnly: false,
    async connect(path) {
      const request = ++connection
      const previous = session
      session = null
      const [response, error] = await track(
        nativeResult<{ data: DBData; session: string }>('project_connect', {
          path,
        })
      )
      if (request !== connection) return [null, 'STALE_PROJECT: 專案已切換']
      if (error || !response) {
        session = previous
        return [null, error || '無法讀取專案']
      }
      session = response.session
      return [response.data, null]
    },
    getSourceFolder: () => projectResult('project_source', {}, token()),
    setSourceFolder: (path) =>
      projectResult('project_set_source', { path }, token()),
    save: (key, data) =>
      projectResult('project_save', { keys: [key], data }, token()),
    deepSave: (keys, data) =>
      projectResult(
        'project_save',
        {
          keys: Array.isArray(keys) ? keys : keys.match(/[^.[\]]+/g) || [],
          data,
        },
        token()
      ),
    slice: (key, index) =>
      projectResult('project_slice', { key, index }, token()),
    get: (key) => projectResult('project_get', { key }, token()),
    pullDockings: (data) =>
      projectResult('project_pull_dockings', { data }, token()),
  })
  const fileSystem = (
    token: () => string | null
  ): DesktopApi['fileSystem'] => ({
    openFolder: (path) =>
      projectResult('desktop_open_folder', { path }, token()),
    createFile: (path) => track(nativeResult('file_create', { path })),
    writeJson: (path, data) =>
      track(nativeResult('project_create', { path, data })),
    copyFile: (source, destination) =>
      projectResult(
        'file_transfer',
        { source, destination, moveSource: false, overwrite: false },
        token()
      ),
    moveFile: (source, destination) =>
      projectResult(
        'file_transfer',
        { source, destination, moveSource: true, overwrite: false },
        token()
      ),
    overrideFile: async (source, destination, mode = 'move') => {
      const [, error] = await projectResult(
        'file_transfer',
        { source, destination, moveSource: mode === 'move', overwrite: true },
        token()
      )
      return error ? [null, error] : ['ok', null]
    },
    deleteFile: (path) => projectResult('file_delete', { path }, token()),
    checkExist: (path) => projectResult('file_exists', { path }, token()),
  })

  return {
    migration,
    async importLegacySettings() {
      const result = await native<MigrationStatus | null>('preferences_import')
      if (result) Object.assign(migration, result)
      return result
    },
    async onFileDrop(handler) {
      const unlisten = await window.listen<NativeFileDrop>(
        'desktop-file-drop',
        (event) => {
          handler({
            ...event.payload,
            x: event.payload.x / globalThis.window.devicePixelRatio,
            y: event.payload.y / globalThis.window.devicePixelRatio,
          })
        }
      )
      try {
        const stopErrors = await window.listen('desktop-drop-error', (event) =>
          reportDesktopError(event.payload)
        )
        return () => {
          unlisten()
          stopErrors()
        }
      } catch (error) {
        unlisten()
        throw error
      }
    },
    async onCloseRequested(handler) {
      const unlisten = await window.listen('desktop-close-requested', handler)
      try {
        await invoke('desktop_close_ready')
      } catch (error) {
        unlisten()
        throw error
      }
      return unlisten
    },
    async whenIdle() {
      while (pending.size) await Promise.allSettled([...pending])
    },
    captureProject() {
      const captured = session
      return {
        database: database(() => captured),
        fileSystem: fileSystem(() => captured),
      }
    },
    platform,
    initialize() {
      initialization ||= Promise.all([
        invoke<string>('runtime_platform'),
        getTauriVersion(),
      ])
        .then(async ([os, version]) => {
          Object.assign(platform, {
            os,
            isWindows: os === 'win32',
            isMac: os === 'darwin',
            isLinux: os === 'linux',
          })
          platform.versions.tauri = version
          try {
            Object.assign(
              migration,
              await native<MigrationStatus>('preferences_init')
            )
            if (migration.message) reportDesktopError(migration.message)
          } catch (error) {
            reportDesktopError(error)
          }
        })
        .catch((error) => {
          initialization = undefined
          throw error
        })
      return initialization
    },
    userStore: {
      get: getStore,
      set: (key, value) => native('preferences_set', { key, value }),
      remove: (key) => native('preferences_remove', { key }),
      clear: () => native('preferences_remove', { key: null }),
    },
    browserDialog: {
      open: (options = {}) => native('desktop_open_dialog', { options }),
      save: (options = {}) => native('desktop_save_dialog', { options }),
    },
    scanner: {
      scanImages: (directory, extensions) =>
        native('scan_images', { directory, extensions }),
    },
    database: database(() => session),
    fileSystem: fileSystem(() => session),
    appWindow: {
      openExternal: (url) => openUrl(url),
      close: () => window.close(),
      minimum: () => window.minimize(),
      maximum: () => window.toggleMaximize(),
      startDragging: () => window.startDragging(),
      getAppVersion: () => getVersion(),
      finishClose: () => invoke('desktop_finish_close'),
    },
    toImageUrl: (path) => (path ? convertFileSrc(path) : ''),
  }
}
