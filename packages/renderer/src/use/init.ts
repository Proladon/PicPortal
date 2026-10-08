import hotkeys from 'hotkeys-js'
import { useAppStore } from '../store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import type { DesktopSettings } from '/@/desktop'
import { getSettings } from './settings'
import { DesktopNotImplementedError } from '/@/desktop/errors'
import { reportDesktopError } from '/@/desktop/status'
import useLocale from '/@/use/locale'
import { useViewerStore } from '/@/store/viewerStore'

export default () => {
  const { changeLocale } = useLocale()

  const portalPaneStore = usePortalPaneStore()
  const appStore = useAppStore()
  let disposed = false
  const clearPortals = (event: KeyboardEvent) => {
    event.preventDefault()
    portalPaneStore.ResetActivePortal()
  }
  const openCommander = (event: KeyboardEvent) => {
    event.preventDefault()
    if (!appStore.readOnly) appStore.commander.portal = true
  }
  return {
    init: async (): Promise<DesktopSettings | null> => {
      const settings = await getSettings().catch((error) => {
        if (!(error instanceof DesktopNotImplementedError)) throw error
        reportDesktopError(error)
        return null
      })
      if (disposed) return settings
      if (settings) changeLocale(settings.general.locale)
      if (settings)
        useViewerStore().SET_PORTAL_PANEL_POSITION(
          settings.viewer.portalPanelPosition
        )

      hotkeys('esc', clearPortals)
      hotkeys('f2', 'viewer', openCommander)
      return settings
    },
    dispose: () => {
      disposed = true
      hotkeys.unbind('esc', clearPortals)
      hotkeys.unbind('f2', 'viewer', openCommander)
    },
  }
}
