<template>
  <section class="virtual-view h-full">
    <ViewerState v-if="loading || !pngs.length" :loading="loading" />
    <div
      v-else
      id="virtual-scroll-viewer"
      class="virtual-scroll-viewer h-full px-4"
    >
      <div class="list-container h-full">
        <VirtualList
          :data="pngs"
          :itemSize="ITEM_SIZE"
          :poolBuffer="5"
          dataKey="path"
        >
          <template v-slot="{ item }">
            <div
              class="item-container pb-2"
              :style="{ height: `${ITEM_SIZE}px` }"
            >
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
import ViewerState from '../ViewerState.vue'
import { VirtualList } from 'vue3-virtual-list'
import { map } from 'lodash-es'
import { onMounted, watch } from 'vue'
import useViewer from '/@/use/useViewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const appStore = useAppStore()
const viewerStore = useViewerStore()
const ITEM_SIZE = 140

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
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
  loading.value = false
})
</script>
