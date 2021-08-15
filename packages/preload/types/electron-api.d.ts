
interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>,
  readonly userStore: Object<Function>,
}

declare interface Window {
  electron: Readonly<ElectronApi>
  electronRequire?: NodeRequire
}
