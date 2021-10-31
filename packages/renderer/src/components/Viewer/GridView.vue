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
import GridItem from '/@/components/Viewer/Item/GridItem.vue'
import { computed, ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { NPagination } from 'naive-ui'
import useViewer from '/@/use/useViewer'
import { chunk, map } from 'lodash-es'

// --- Data ---
const imgSize = ref(150)

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, perPage.value)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
  loading.value = false
}

const {
  store,
  loading,
  pngs,
  page,
  perPage,
  folderFiles,
  mainFolder,
  selectItem,
} = useViewer(10, chunkFiles)

// --- Watch ---
watch(mainFolder, async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  await chunkFiles()
})

// --- Mounted ---
onMounted(async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  await chunkFiles()
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
