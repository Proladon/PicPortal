<template>
  <section class="grid-view">
    <div v-if="loading" class="w-full"></div>
    <div
      v-if="pngs.length && !loading"
      class="list-container"
      :style="`grid-template-columns: repeat(auto-fit, minmax(${imgSize}px, 1fr));`"
    >
      <GridItem
        v-for="item in pngs[page - 1].src"
        :key="item"
        :img="item.path"
        @click="selectItem($event, item)"
      />
    </div>

    <div class="pagination-container">
      <n-pagination
        v-model:page="page"
        :page-count="pngs.length"
        show-quick-jumper
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import HandleBar from '/@/components/Viewer/Handlebar.vue'
import GridItem from '/@/components/Viewer/Item/GridItem.vue'
import { VirtualList } from 'vue3-virtual-list'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { chunk, map, findIndex } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'
import { dataClone } from '/@/utils/data'
import { NSpin, NPagination } from 'naive-ui'

// --- Data ---
const store = useStore()
const loading = ref(false)
const imgSize = ref(150)
const perPage = ref(10)
const page = ref(1)
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
  const filesChunkList = chunk(files, perPage.value)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
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
.grid-view {
  @apply relative overflow-y-auto h-full flex flex-col justify-between;
}
.list-container {
  @apply w-full grid gap-5 p-[15px];
}
.item-container {
  @apply grid gap-10 items-center px-[15px];
}

.pagination-container {
  @apply sticky bottom-[30px] left-0 right-0 py-2 px-[15px];
  @apply bg-[var(--primary-bg-1)] grid place-content-center;
}
</style>
