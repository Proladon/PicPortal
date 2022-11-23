import hotkeys from 'hotkeys-js'
import { useAppStore } from '../store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useElectron } from '/@/use/electron'
import useLocale from '/@/use/locale'

export default () => {
  const { userStore } = useElectron()
  const { changeLocale } = useLocale()

  const portalPaneStore = usePortalPaneStore()
  const appStore = useAppStore()
  return {
    init: async (): Promise<void> => {
      const settings = await userStore.get('settings')
      if (settings) changeLocale(settings.general.locale)

      hotkeys('esc', (event) => {
        event.preventDefault()
        portalPaneStore.ResetActivePortal()
      })
      hotkeys('f2', 'viewer', (event) => {
        event.preventDefault()
        appStore.commander.portal = true
      })
    },
  }
}
