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

  return {
    runtime: 'tauri',
    platform,
    initialize() {
      initialization ||= Promise.all([
        invoke<string>('runtime_platform'),
        getTauriVersion(),
      ])
        .then(([os, version]) => {
          Object.assign(platform, {
            os,
            isWindows: os === 'win32',
            isMac: os === 'darwin',
            isLinux: os === 'linux',
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
      clear: async () => unavailable('設定清除（階段 5）'),
    },
    browserDialog: {
      open: async () => unavailable('開啟對話框（階段 3）'),
      save: async () => unavailable('儲存對話框（階段 4）'),
    },
    scanner: { scanImages: async () => unavailable('圖片掃描（階段 3）') },
    database: {
      connect: () => unavailableResult('專案讀取（階段 3）'),
      save: () => unavailableResult('專案儲存（階段 4）'),
      deepSave: () => unavailableResult('分類儲存（階段 4）'),
      slice: () => unavailableResult('分類刪除（階段 4）'),
      get: () => unavailableResult('專案資料讀取（階段 3）'),
      pullDockings: () => unavailableResult('待處理資料清理（階段 4）'),
    },
    fileSystem: {
      openFolder: () => unavailableResult('開啟資料夾（階段 5）'),
      createFile: () => unavailableResult('建立檔案（階段 4）'),
      copyFile: () => unavailableResult('複製檔案（階段 4）'),
      moveFile: () => unavailableResult('搬移檔案（階段 4）'),
      deleteFile: () => unavailableResult('刪除檔案（階段 4）'),
      overrideFile: () => unavailableResult('覆寫檔案（階段 4）'),
      checkExist: () => unavailableResult('檔案檢查（階段 3）'),
      writeJson: () => unavailableResult('JSON 寫入（階段 4）'),
    },
    appWindow: {
      openExternal: (url) => openUrl(url),
      close: () => window.close(),
      minimum: () => window.minimize(),
      maximum: () => window.toggleMaximize(),
      startDragging: () => window.startDragging(),
      getAppVersion: () => getVersion(),
    },
    toImageUrl: (path) => (path ? convertFileSrc(path) : ''),
    getDroppedPaths: () => unavailable('原生檔案拖入（階段 5）'),
  }
}
