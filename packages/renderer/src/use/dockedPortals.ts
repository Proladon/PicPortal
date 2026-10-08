import { computed } from 'vue'
import { findIndex, pull } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { sameFilePath } from '/@/utils/file'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

/** Portals docked on one image, plus removing a single portal from it. */
export const useDockedPortals = (img: () => string | undefined) => {
  const appStore = useAppStore()
  const viewerStore = useViewerStore()
  const portalPaneStore = usePortalPaneStore()

  const docking = computed(() =>
    viewerStore.dockings.find((item) => sameFilePath(item.target, img()))
  )

  const targetPortals = computed<Portal[]>(() => {
    const exist = docking.value
    if (!exist) return []
    return exist.portals.flatMap((id) => {
      const portal = portalPaneStore.flattenPortals.find(
        (item) => item.id === id
      )
      return portal ? [portal] : []
    })
  })

  // => 移除圖片上的 portal
  const removePortal = async (portal: Portal) => {
    if (appStore.readOnly) return
    const targetIndex = findIndex(viewerStore.dockings, (item) =>
      sameFilePath(item.target, img())
    )
    const portalsRef = dataClone(docking.value?.portals || [])
    pull(portalsRef, portal.id)

    if (!portalsRef.length) {
      await appStore.DBSlice({ key: 'dockings', index: targetIndex })
      await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
      return
    }

    await appStore.DeepSaveToDB({
      key: `[dockings][${targetIndex}][portals]`,
      data: portalsRef,
    })
    await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  }

  return { docking, targetPortals, removePortal }
}
