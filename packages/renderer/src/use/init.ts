import hotkeys from 'hotkeys-js'
import { useAppStore } from '../store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import type { DesktopSettings } from '/@/desktop'
import { getSettings } from './settings'
import useLocale from '/@/use/locale'

export default () => {
  const { changeLocale } = useLocale()

  const portalPaneStore = usePortalPaneStore()
  const appStore = useAppStore()
  return {
    init: async (): Promise<DesktopSettings> => {
      const settings = await getSettings()
      changeLocale(settings.general.locale)

      hotkeys('esc', (event) => {
        event.preventDefault()
        portalPaneStore.ResetActivePortal()
      })
      hotkeys('f2', 'viewer', (event) => {
        event.preventDefault()
        appStore.commander.portal = true
      })
      return settings
    },
  }
}
