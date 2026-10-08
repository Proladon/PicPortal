import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'
import { useAppStore } from '/@/store/appStore'
import { getFileName } from '/@/utils/file'

/** Pick the project's main (source) folder. Existing dockings are reset. */
export const useMainFolder = () => {
  const appStore = useAppStore()

  const choseMainFolder = async () => {
    const { browserDialog, database } = useDesktop()
    try {
      const res = await browserDialog.open({
        directory: true,
      })

      if (res) {
        if (useDesktop().runtime === 'tauri' || database.readOnly) {
          const [folder, error] = await database.setSourceFolder(res[0])
          if (error) throw new Error(error)
          appStore.sourceFolder = folder
          await appStore.SyncDBDataToState({
            syncKeys: ['mainFolder', 'dockings'],
          })
          return
        }
        const folder = {
          name: getFileName(res[0]),
          path: res[0].replaceAll('\\', '/'),
        }
        await appStore.SaveToDB({ key: 'mainFolder', data: folder })
        await appStore.SaveToDB({ key: 'dockings', data: [] })
        await appStore.SyncDBDataToState({
          syncKeys: ['mainFolder', 'dockings'],
        })
      }
    } catch (error) {
      reportDesktopError(error)
    }
  }

  return { choseMainFolder }
}
