<template>
  <section class="viewer">
    <n-empty
      v-if="!loading && !pngs.length"
      description="No images found"
      class="full flex-center-items"
    />
    <n-spin :show="loading">
      <div v-if="loading" :style="`height: ${ch}px`" class="w-full"></div>
      <div
        v-if="pngs.length && !loading"
        class="virtual-scroll-viewer"
        id="virtual-scroll-viewer"
      >
        <div class="list-container" :style="`height: ${ch}px`">
          <VirtualList
            :data="pngs"
            :itemSize="190"
            :poolBuffer="5"
            dataKey="path"
          >
            <template v-slot="{ item }">
              <div
                class="item-container"
                :style="`grid-template-columns: repeat(${column}, 1fr);`"
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
    </n-spin>
  </section>
</template>

<script lang="ts" setup>
import VirtualGridItem from './components/VirtualGridItem.vue'
import { VirtualList } from 'vue3-virtual-list'
import { ref } from '@vue/reactivity'
import { chunk, map } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'
import { NSpin, NEmpty } from 'naive-ui'
import useViewer from '/@/use/useViewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const appStore = useAppStore()
const viewerStore = useViewerStore()
// --- Data ---
const ch = ref(0)
const column = ref(5)
// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  const files = map(showFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, column.value)
  const newData = filesChunkList.map((items) => ({
    path: items[0].path,
    src: items
  }))
  pngs.value = newData
  loading.value = false
}

const { loading, pngs, showFiles, mainFolder, selectItem } = useViewer(
  0,
  chunkFiles,
  true
)

// --- Watch ---
watch(mainFolder, async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
})

// --- Mounted ---
onMounted(async () => {
  loading.value = true
  ch.value = window.innerHeight
  ch.value = window.innerHeight - 100
  window.onresize = () => {
    ch.value = window.innerHeight - 100
  }
  await chunkFiles()
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  loading.value = false
})
</script>

<style lang="postcss">
.vue3-virtual-list-item-container {
  @apply grid;
}
</style>

<style lang="postcss" scoped>
.list-container {
  @apply w-full m-auto;
}
.item-container {
  @apply grid gap-10 items-center px-[15px];
}
</style>
