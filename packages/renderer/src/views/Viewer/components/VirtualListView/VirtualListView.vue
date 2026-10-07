<template>
  <section class="virtual-view">
    <n-spin v-if="loading" class="full grid-center-items" />
    <n-empty
      v-else-if="!pngs.length"
      description="No images found"
      class="full flex-center-items"
    />
    <!-- <div v-if="loading" :style="`height: ${ch}px`" class="w-full"></div> -->
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
            <div class="item-container">
              <VirtualListItem
                :img="item.path"
                @click="selectItem($event, item)"
              />
            </div>
          </template>
        </VirtualList>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import VirtualListItem from './components/VirtualListItem.vue'
import { VirtualList } from 'vue3-virtual-list'
import { ref } from '@vue/reactivity'
import { map } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'
import useViewer from '/@/use/useViewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { NEmpty, NSpin } from 'naive-ui'

const appStore = useAppStore()
const viewerStore = useViewerStore()
// --- Data ---
const ch = ref(0)
const column = ref(1)

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  const files = map(showFiles.value, (path) => ({ path: path }))
  pngs.value = files
  loading.value = false
}

const { loading, pngs, showFiles, mainFolder, selectItem } = useViewer(
  0,
  chunkFiles
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
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
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
