import { useElectron } from '/@/use/electron'
export interface UserSettings {
  general: { locale: string; theme: string }
  viewer: { portalPanelPosition: 'left' | 'right' }
  hotkeys: Record<string, unknown>
}

export function createDefaultSettings(): UserSettings {
  return {
    general: { locale: 'en', theme: 'picportal' },
    viewer: { portalPanelPosition: 'right' },
    hotkeys: {},
  }
}

export async function getSettings(): Promise<UserSettings> {
  const { userStore } = useElectron()
  const saved = await userStore.get('settings')
  if (saved) return saved
  const defaults = createDefaultSettings()
  await userStore.set('settings', defaults)
  return defaults
}
