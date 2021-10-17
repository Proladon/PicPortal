<template>
  <section class="focus-view">
    <FocusItem v-if="pngs.length" :img="pngs[curFile].path" />
  </section>
</template>

<script lang="ts" setup>
import HandleBar from '/@/components/Viewer/Handlebar.vue'
import FocusItem from '/@/components/Viewer/Item/FocusItem.vue'
import { VirtualList } from 'vue3-virtual-list'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { chunk, map, findIndex } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'
import { dataClone } from '/@/utils/data'

// --- Data ---
const store = useStore()
const loading = ref(false)
const curFile = ref(0)

// --- Computed ---
const mainFolder = computed(() => store.getters.mainFolder)
const folderFiles = computed(() => store.state.viewer.folderFiles)
const activedPortals = computed(() => store.getters.activedPortals)
const dockings = computed(() => store.getters.dockings)

const pngs = ref<unknown>([])
// --- Watch ---
watch(mainFolder, async () => {
  loading.value = true
  await chunkFiles()
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  loading.value = false
})

// --- Methods ---
const chunkFiles = async () => {
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  pngs.value = files
}

const selectItem = async (e, row: unknown) => {
  const ignore = ['I', 'path', 'svg']
  const htmlTarget = e.target.tagName
  if (ignore.includes(htmlTarget)) return
  if (!activedPortals.value.length) return

  const target = row.path

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

// --- Mounted ---
onMounted(async () => {
  loading.value = true

  await chunkFiles()
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  loading.value = false
})
</script>

<style lang="postcss">
.vue3-virtual-list-item-container {
  @apply grid;
}
</style>

<style lang="postcss" scoped>
.focus-view {
  @apply h-full pb-[30px];
}
.list-container {
  @apply w-full m-auto;
}
.item-container {
  @apply grid gap-10 items-center px-[15px];
}
</style>
