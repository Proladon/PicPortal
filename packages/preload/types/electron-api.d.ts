interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>
  readonly userStore: Object<Function>
  readonly browserDialog: Object<Function>
  readonly fastGlob: Object<Function>
  readonly fileSystem: Object<Function>
  readonly database: Object<Function>
  readonly appWindow: Object<Function>
  readonly platform: { [key: string]: boolean }
}

declare interface Window {
  electron: Readonly<ElectronApi>
  electronRequire?: NodeRequire
}
