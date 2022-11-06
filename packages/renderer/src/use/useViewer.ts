import { useMessage, useNotification } from 'naive-ui'
import { watch } from '@vue/runtime-core'
import { computed, ref } from '@vue/reactivity'
import { dataClone } from '/@/utils/data'
import { map, findIndex, uniq } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '../store/portalPaneStore'

const useViewer = (
  perPageDefault: number,
  chunkFiles: CallableFunction,
  virtualGrid = false
): any => {
  const appStore = useAppStore()
  const viewerStore = useViewerStore()
  const portalPaneStore = usePortalPaneStore()
  const message = useMessage()
  const notify = useNotification()

  const loading = ref(false)
  const pngs = ref<unknown>([])
  const perPage = ref(perPageDefault)
  const page = ref(1)

  const mainFolder = computed(() => appStore.projectMainFolder)
  const folderFiles = computed(() => viewerStore.folderFiles)
  const filesCount = computed(() => viewerStore.folderFilesCount)
  const dockings = computed(() => viewerStore.dockings)
  const activePortals = computed(() => portalPaneStore.activePortals)
  const wrapingStatus = computed(() => viewerStore.wrap.wraping)
  const dockingMode = computed(() => portalPaneStore.dockingMode)
  const showFiles = computed(() => viewerStore.showFiles)
  const refreshSignal = computed(() => viewerStore.signal.refresh)

  watch(refreshSignal, async () => {
    if (refreshSignal.value) {
      console.log('refresh')
      await chunkFiles()
      viewerStore.signal.refresh = false
      // notify.success({
      //   title: 'Refresh done',
      //   duration: 1000,
      // })
    }
  })

  watch(
    viewerStore.filter,
    async () => {
      viewerStore.signal.refresh = true
    },
    { deep: true }
  )

  // watch(showFiles, async () => {
  //   console.log('showFiles')
  //   if (wrapingStatus.value) return
  //   await chunkFiles()
  // })
  // watch(filesCount, async () => {
  //   console.log('filesCount')
  //   if (wrapingStatus.value) return
  //   await chunkFiles()
  // })
  // watch(wrapingStatus, async () => {
  //   console.log('wrapingStatus')
  //   if (wrapingStatus.value) return
  //   await chunkFiles()
  // })

  // docking protals
  const selectItem = async (e: any, row: any): Promise<void> => {
    const ignore = ['I', 'path', 'svg']
    const htmlTarget = e.target.tagName
    if (ignore.includes(htmlTarget)) return
    if (!activePortals.value.length) {
      message.warning('請先至少啟用一個 Portal')
      return
    }

    let target = row.path

    if (virtualGrid) {
      const rowImgs = row.item.src
      const index = row.childIndex
      target = rowImgs[index].path
    }

    const dockingsRef: any = dataClone(dockings.value)
    const activedPortalsRef: any = dataClone(activePortals.value)

    const isExist = findIndex(dockingsRef, { target: target })

    if (isExist >= 0) {
      if (dockingMode.value.toLowerCase() === 'append') {
        dockingsRef[isExist].portals.push(...map(activedPortalsRef, 'id'))
        dockingsRef[isExist].portals = uniq(dockingsRef[isExist].portals)
      } else if (dockingMode.value.toLowerCase() === 'override') {
        const dockingsData = {
          target,
          portals: map(activedPortalsRef, 'id'),
        }
        dockingsRef[isExist] = dockingsData
      }
    }
    if (isExist < 0) {
      const dockingsData = {
        target,
        portals: map(activedPortalsRef, 'id'),
      }
      dockingsRef.push(dockingsData)
    }

    await appStore.SaveToDB({ key: 'dockings', data: dockingsRef })
    await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  }

  return {
    loading,
    pngs,
    page,
    perPage,
    folderFiles,
    dockings,
    activePortals,
    wrapingStatus,
    filesCount,
    mainFolder,
    selectItem,
    chunkFiles,
    showFiles,
  }
}

export default useViewer
