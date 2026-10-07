/** Desktop operations keep the existing [value, error] convention. */
export type DesktopError = string
export type DesktopResult<T> = [T, null] | [null, DesktopError]

export interface DialogFilter {
  name: string
  extensions: string[]
}

export interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: DialogFilter[]
  directory?: boolean
  multiple?: boolean
}

export interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: DialogFilter[]
}

export interface DesktopSettings {
  general: { locale: string; theme: string }
  viewer: { portalPanelPosition: 'left' | 'right' }
  hotkeys: Record<string, unknown>
}

export interface DesktopApi {
  readonly runtime: 'electron' | 'tauri'
  readonly platform: {
    os: string
    isWindows: boolean
    isMac: boolean
    isLinux: boolean
    versions: Readonly<Record<string, string | undefined>>
  }
  readonly userStore: {
    get(key: 'projects'): Promise<Project[] | null>
    get(key: 'settings'): Promise<DesktopSettings | null>
    set(key: 'projects', value: Project[]): Promise<void>
    set(key: 'settings', value: DesktopSettings): Promise<void>
    remove(key: string): Promise<void>
    clear(): Promise<void>
  }
  readonly browserDialog: {
    /** Cancellation is always null, never an Electron response object. */
    open(options?: OpenDialogOptions): Promise<string[] | null>
    save(options?: SaveDialogOptions): Promise<string | null>
  }
  readonly scanner: {
    scanImages(directory: string, extensions: string[]): Promise<string[]>
  }
  readonly database: {
    connect(path: string): Promise<DesktopResult<DBData>>
    save(key: string, serializedData: string): Promise<DesktopResult<string>>
    deepSave(
      keys: string | string[],
      serializedData: string
    ): Promise<DesktopResult<string>>
    slice(key: string, index: number): Promise<DesktopResult<string>>
    get(key: string): Promise<DesktopResult<unknown>>
    pullDockings(serializedDockings: string): Promise<DesktopResult<string>>
  }
  readonly fileSystem: {
    openFolder(path: string): Promise<DesktopResult<string>>
    createFile(path: string): Promise<DesktopResult<void>>
    copyFile(source: string, destination: string): Promise<DesktopResult<void>>
    moveFile(source: string, destination: string): Promise<DesktopResult<void>>
    deleteFile(path: string): Promise<DesktopResult<string>>
    /** Legacy override moves the source, including in copy conflict mode. */
    overrideFile(
      source: string,
      destination: string
    ): Promise<DesktopResult<string>>
    checkExist(path: string): Promise<DesktopResult<boolean>>
    writeJson(path: string, data: unknown): Promise<DesktopResult<void>>
  }
  readonly appWindow: {
    openExternal(url: string): Promise<void>
    close(): Promise<void>
    minimum(): Promise<void>
    maximum(): Promise<void>
    getAppVersion(): Promise<string>
  }
  toImageUrl(path?: string): string
  /** Electron HTML drop paths; Tauri will use native drop events in stage 5. */
  getDroppedPaths(files: File[]): string[]
}
