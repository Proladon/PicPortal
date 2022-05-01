<template>
  <n-scrollbar class="grid-view">
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
  </n-scrollbar>
  <div class="pagination-container">
    <n-pagination
      v-model:page="page"
      :page-count="pngs.length"
      show-quick-jumper
    />
  </div>
</template>

<script lang="ts" setup>
import GridItem from './components/GridItem.vue'
import { ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { NScrollbar, NPagination } from 'naive-ui/es'
import useViewer from '/@/use/useViewer'
import { chunk, map } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const appStore = useAppStore()
const viewerStore = useViewerStore()
// --- Data ---
const imgSize = ref(150)

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  const files = map(showFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, perPage.value)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
  loading.value = false
}

const {
  loading,
  pngs,
  page,
  perPage,
  folderFiles,
  mainFolder,
  selectItem,
  showFiles
} = useViewer(20, chunkFiles)

// --- Watch ---
watch(mainFolder, async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
})

// --- Mounted ---
onMounted(async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
})
</script>

<!-- <style lang="postcss">
:deep(.vue3-virtual-list-item-container ){
  @apply grid;
}
</style> -->

<style lang="postcss" scoped>
:deep(.vue3-virtual-list-item-container) {
  @apply grid;
}
.grid-view {
  @apply relative overflow-y-auto h-full flex flex-col justify-between;
}
.list-container {
  @apply w-full grid gap-5 pb-[30px];
}

.pagination-container {
  @apply sticky bottom-0 left-0 right-0 py-2 px-[15px];
  @apply bg-primary-bg grid place-content-center;
}
</style>
