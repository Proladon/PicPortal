<template>
  <ViewerState v-if="loading || !pngs.length" :loading="loading" />
  <div v-else class="h-full overflow-y-auto">
    <div class="list-view flex flex-col gap-2 px-4 pt-1 pb-6">
      <VirtualListItem
        v-for="item in pngs"
        :key="item.path"
        class="!h-[132px]"
        :img="item.path"
        @click="selectItem($event, item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import VirtualListItem from '../VirtualListView/components/VirtualListItem.vue'
import ViewerState from '../ViewerState.vue'
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
