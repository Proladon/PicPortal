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
  const saved = await userStore.get('settings')
  if (saved) return saved
  const defaults = createDefaultSettings()
  if (useDesktop().runtime === 'electron')
    await userStore.set('settings', defaults)
  return defaults
}
