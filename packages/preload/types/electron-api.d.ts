interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>
  readonly userStore: typeof import('../src/render/modules/userStore').default
  readonly browserDialog: typeof import('../src/render/modules/browserDialog').default
  readonly fastGlob: typeof import('../src/render/modules/fastGlob').default
  readonly fileSystem: typeof import('../src/render/modules/fileSystem').default
  readonly database: typeof import('../src/render/modules/database').default
  readonly appWindow: typeof import('../src/render/modules/app').default
  readonly platform: typeof import('../src/render/modules/platform').default
}

declare interface Window {
  electron: Readonly<ElectronApi>
  electronRequire?: NodeRequire
}
