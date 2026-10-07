import hotkeys from 'hotkeys-js'
import { useAppStore } from '../store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import type { DesktopSettings } from '/@/desktop'
import { getSettings } from './settings'
import { DesktopNotImplementedError } from '/@/desktop/errors'
import { reportDesktopError } from '/@/desktop/status'
import useLocale from '/@/use/locale'

export default () => {
  const { changeLocale } = useLocale()

  const portalPaneStore = usePortalPaneStore()
  const appStore = useAppStore()
  return {
    init: async (): Promise<DesktopSettings | null> => {
      const settings = await getSettings().catch((error) => {
        if (!(error instanceof DesktopNotImplementedError)) throw error
        reportDesktopError(error)
        return null
      })
      if (settings) changeLocale(settings.general.locale)

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
