<template>
  <n-spin v-if="loading" class="full grid-center-items" />
  <n-empty
    v-else-if="!pngs.length"
    description="No images found"
    class="full flex-center-items"
  />
  <n-scrollbar v-else class="h-full">
    <div class="list-view">
      <VirtualListItem
        v-for="item in pngs"
        :key="item.path"
        :img="item.path"
        @click="selectItem($event, item)"
      />
    </div>
  </n-scrollbar>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { NEmpty, NScrollbar, NSpin } from 'naive-ui'
import VirtualListItem from '../VirtualListView/components/VirtualListItem.vue'
import useViewer from '/@/use/useViewer'
import { useViewerStore } from '/@/store/viewerStore'
const viewerStore = useViewerStore()
const chunkFiles = async () => {
  loading.value = true
  try {
    await viewerStore.GetFolderAllFiles({})
    pngs.value = showFiles.value.map((path: string) => ({ path }))
  } finally {
    loading.value = false
  }
}
const { loading, pngs, mainFolder, selectItem, showFiles } = useViewer(
  0,
  chunkFiles
)
watch(mainFolder, chunkFiles)
onMounted(chunkFiles)
</script>

<style scoped lang="postcss">
.list-view {
  @apply px-5 pb-10;
}
.list-view :deep(.virtual-list-item) {
  height: 190px;
}
</style>
