import { useDesktop } from '/@/desktop'
import type { DesktopSettings } from '/@/desktop'

export function createDefaultSettings(): DesktopSettings {
  return {
    general: { locale: 'en', theme: 'picportal', appearance: 'dark' },
    viewer: { portalPanelPosition: 'right' },
    hotkeys: {},
  }
}

export async function getSettings(): Promise<DesktopSettings> {
  const { userStore } = useDesktop()
  return (await userStore.get('settings')) || createDefaultSettings()
}
