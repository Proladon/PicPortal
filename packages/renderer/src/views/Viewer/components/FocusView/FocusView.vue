<template>
  <section class="focus-view">
    <n-spin v-if="loading" class="full grid-center-items" />
    <n-empty
      v-else-if="!pngs.length"
      description="No images found"
      class="full flex-center-items"
    />
    <template v-else>
      <div class="flex gap-3 justify-center">
        <n-button
          class="focus-prev"
          :disabled="curFile === 0"
          @click="curFile--"
          >上一張</n-button
        >
        <span>{{ curFile + 1 }} / {{ pngs.length }}</span>
        <n-button
          class="focus-next"
          :disabled="curFile >= pngs.length - 1"
          @click="curFile++"
          >下一張</n-button
        >
      </div>
      <FocusItem :img="pngs[curFile].path" />
    </template>
  </section>
</template>

<script lang="ts" setup>
import FocusItem from './components/FocusItem.vue'
import { ref } from 'vue'
import { map } from 'lodash-es'
import { onMounted, watch } from 'vue'
import useViewer from '/@/use/useViewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { NButton, NEmpty, NSpin } from 'naive-ui'

const appStore = useAppStore()
const viewerStore = useViewerStore()
// --- Data ---
const curFile = ref(0)

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  const files = map(showFiles.value, (path) => ({ path: path }))
  pngs.value = files
  curFile.value = 0
  loading.value = false
}

const { loading, pngs, showFiles, mainFolder } = useViewer(0, chunkFiles)

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
