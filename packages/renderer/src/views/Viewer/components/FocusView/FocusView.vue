<template>
  <section class="focus-view">
    <FocusItem v-if="pngs.length" :img="pngs[curFile].path" />
  </section>
</template>

<script lang="ts" setup>
import FocusItem from './components/FocusItem.vue'
import { ref } from '@vue/reactivity'
import { map } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'
import useViewer from '/@/use/useViewer'
// --- Data ---
const curFile = ref(0)

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  pngs.value = files
  loading.value = false
}

const { store, loading, pngs, folderFiles, mainFolder } = useViewer(
  0,
  chunkFiles
)

// --- Watch ---
watch(mainFolder, async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  await chunkFiles()
})

// --- Mounted ---
onMounted(async () => {
  loading.value = true
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
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
