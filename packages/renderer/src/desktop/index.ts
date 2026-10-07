import { createElectronAdapter } from './electron'
import type { DesktopApi } from './types'

export type { DesktopApi, DesktopResult, DesktopSettings } from './types'

let desktop: DesktopApi | undefined

/** Synchronous and lazy: safe for stores that access desktop at module scope. */
export function useDesktop(): DesktopApi {
  if (!desktop) {
    if (typeof window === 'undefined' || !window.electron) {
      throw new Error('DESKTOP_UNAVAILABLE: 桌面執行環境尚未初始化')
    }
    desktop = createElectronAdapter(window.electron)
  }
  return desktop
}

export function toImageUrl(path?: string): string {
  return useDesktop().toImageUrl(path)
}
