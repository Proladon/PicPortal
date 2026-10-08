import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'
import { useAppStore } from '/@/store/appStore'

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
        const [folder, error] = await database.setSourceFolder(res[0])
        if (error) throw new Error(error)
        appStore.sourceFolder = folder
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
