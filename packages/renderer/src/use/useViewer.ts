import { watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { dataClone } from '/@/utils/data'
import { map, findIndex, chunk, uniq } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const useViewer = (
  perPageDefault: number,
  chunkFiles: CallableFunction,
  virtualGrid = false
): any => {
  const appStore = useAppStore()
  const viewerStore = useViewerStore()
  const store = useStore()
  const loading = ref(false)
  const pngs = ref<unknown>([])
  const perPage = ref(perPageDefault)
  const page = ref(1)

  const mainFolder = computed(() => appStore.projectMainFolder)
  const folderFiles = computed(() => viewerStore.folderFiles)
  const dockings = computed(() => store.getters.dockings)
  const activedPortals = computed(() => store.getters.activedPortals)
  const wrapingStatus = computed(() => store.state.viewer.wraping)
  const filesCount = computed(() => store.getters.filesCount)
  const dockingProtalMode = computed(() => store.state.portal.dockingProtalMode)

  watch(filesCount, async () => {
    if (wrapingStatus.value) return
    console.log('filesCount')
    await chunkFiles()
  })
  watch(wrapingStatus, async () => {
    if (wrapingStatus.value) return
    console.log('wrapingStatus')
    await chunkFiles()
  })

  // docking protals
  const selectItem = async (e: any, row: any): Promise<void> => {
    const ignore = ['I', 'path', 'svg']
    const htmlTarget = e.target.tagName
    if (ignore.includes(htmlTarget)) return
    if (!activedPortals.value.length) return

    let target = row.path

    if (virtualGrid) {
      const rowImgs = row.item.src
      const index = row.childIndex
      target = rowImgs[index].path
    }

    const dockingsRef = dataClone(dockings.value)
    const activedPortalsRef: ActivedPortals[] = dataClone(activedPortals.value)

    const isExist = findIndex(dockingsRef, { target: target })

    if (isExist >= 0) {
      if (dockingProtalMode.value.toLowerCase() === 'append') {
        dockingsRef[isExist].portals.push(...map(activedPortalsRef, 'id'))
        dockingsRef[isExist].portals = uniq(dockingsRef[isExist].portals)
      } else if (dockingProtalMode.value.toLowerCase() === 'override') {
        const dockingsData = {
          target,
          portals: map(activedPortalsRef, 'id')
        }
        dockingsRef[isExist] = dockingsData
      }
    }
    if (isExist < 0) {
      const dockingsData = {
        target,
        portals: map(activedPortalsRef, 'id')
      }
      dockingsRef.push(dockingsData)
    }

    await store.dispatch('DOCKING', {
      key: 'dockings',
      data: dockingsRef
    })
    await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  }

  return {
    store,
    loading,
    pngs,
    page,
    perPage,
    folderFiles,
    dockings,
    activedPortals,
    wrapingStatus,
    filesCount,
    mainFolder,
    selectItem,
    chunkFiles
  }
}

export default useViewer
