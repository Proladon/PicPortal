import { watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { dataClone } from '/@/utils/data'
import { map, findIndex, chunk } from 'lodash-es'

const useViewer = (
  perPageDefault: number,
  chunkFiles: CallableFunction,
  virtualGrid = false
): any => {
  const store = useStore()
  const loading = ref(false)
  const pngs = ref<unknown>([])
  const perPage = ref(perPageDefault)
  const page = ref(1)

  const mainFolder = computed(() => store.getters.mainFolder)
  const folderFiles = computed(() => store.state.viewer.folderFiles)
  const dockings = computed(() => store.getters.dockings)
  const activedPortals = computed(() => store.getters.activedPortals)
  const wrapingStatus = computed(() => store.state.viewer.wraping)
  const filesCount = computed(() => store.getters.filesCount)

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

  // give docking tags
  const selectItem = async (e, row: unknown): Promise<void> => {
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

    const dockingsData = {
      target,
      portals: map(activedPortalsRef, 'id'),
    }
    const isExist = findIndex(dockingsRef, { target: target })

    if (isExist >= 0) dockingsRef[isExist] = dockingsData
    if (isExist < 0) dockingsRef.push(dockingsData)

    await store.dispatch('DOCKING', {
      key: 'dockings',
      data: dockingsRef,
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
    chunkFiles,
  }
}

export default useViewer
