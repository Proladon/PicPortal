<template>
  <div class="text-white">viewer</div>
  <div
    v-if="pngs.length"
    class="virtual-scroll-viewer"
    id="virtual-scroll-viewer"
  >
    <div class="list-container">
      <VirtualList :data="pngs" :itemSize="300" :poolBuffer="5" dataKey="path">
        <template v-slot="{ item, index }">
          <div class="item-container">
            <ImageItem
              @click="selectItem({ item, parent: index, child: childIndex })"
              v-for="(img, childIndex) in item.src"
              :key="childIndex"
              :img="img.path"
            />
          </div>
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ImageItem from '/@/components/Viewer/ImageItem.vue'
import { VirtualList } from 'vue3-virtual-list'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { useElectron } from '/@/use/electron'
import { chunk, map } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'

// --- Data ---
const { fastGlob } = useElectron()
const store = useStore()
const mainFolder = computed(() => store.getters.mainFolder)
const folderFiles = computed(() => store.state.viewer.folderFiles)
const selected = computed(() => store.state.viewer.selected)
const pngs = ref<unknown>([])
// --- Watch ---
watch(mainFolder, async () => {
  await getAllFiles()
})

const getAllFiles = async () => {
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  console.log('files', files)
  const filesChunkList = chunk(files, 4)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
}

// --- Methods ---
const selectItem = (data: unknown) => {
  console.log('in')
  store.commit('UPDATE_SELECTED', data)
}

onMounted(async () => {
  await getAllFiles()
})
</script>

<style lang="postcss" scoped>
.list-container {
  @apply w-full h-[800px] m-auto;
}
.item-container {
  @apply flex gap-10 justify-center items-center;
  height: 300px;
}
</style>
