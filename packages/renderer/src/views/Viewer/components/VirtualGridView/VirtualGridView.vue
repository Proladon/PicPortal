<template>
  <section ref="viewerRef" class="viewer h-full">
    <ViewerState v-if="loading || !pngs.length" :loading="loading" />
    <div v-else id="virtual-scroll-viewer" class="virtual-scroll-viewer h-full">
      <div class="list-container h-full pt-1">
        <VirtualList
          :key="column"
          :data="pngs"
          :itemSize="174"
          :poolBuffer="5"
          dataKey="path"
        >
          <template v-slot="{ item }">
            <div
              class="item-container grid items-start gap-3 px-4"
              :style="`grid-template-columns: repeat(${column}, ${ITEM_SIZE}px);`"
            >
              <VirtualGridItem
                @click="selectItem($event, { item, childIndex })"
                v-for="(img, childIndex) in item.src"
                :key="childIndex"
                :img="img.path"
              />
            </div>
          </template>
        </VirtualList>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import VirtualGridItem from './components/VirtualGridItem.vue'
import ViewerState from '../ViewerState.vue'
import { VirtualList } from 'vue3-virtual-list'
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { chunk, map } from 'lodash-es'
import { onMounted, watch } from 'vue'
import useViewer from '/@/use/useViewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const appStore = useAppStore()
const viewerStore = useViewerStore()
// --- Data ---
const ITEM_SIZE = 150
const GAP = 12
const PADDING = 32
const viewerRef = ref<HTMLElement>()
const { width } = useElementSize(viewerRef)
const column = computed(() =>
  width.value
    ? Math.max(1, Math.floor((width.value - PADDING + GAP) / (ITEM_SIZE + GAP)))
    : 5
)
// --- Methods ---
const chunkRows = () => {
  const files = map(showFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, column.value)
  pngs.value = filesChunkList.map((items) => ({
    path: items[0].path,
    src: items,
  }))
}
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  chunkRows()
  loading.value = false
}

const { loading, pngs, showFiles, mainFolder, selectItem } = useViewer(
  0,
  chunkFiles,
  true
)

// --- Watch ---
watch(column, () => {
  if (!loading.value) chunkRows()
})
watch(mainFolder, async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
})

// --- Mounted ---
onMounted(async () => {
  loading.value = true
  await chunkFiles()
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  loading.value = false
})
</script>
