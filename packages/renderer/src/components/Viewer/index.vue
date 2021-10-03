<template>
  <section class="viewer">
    <HandleBar />
    <div
      v-if="pngs.length"
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
  </section>
</template>

<script lang="ts" setup>
import HandleBar from '/@/components/Viewer/Handlebar.vue'
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
const ch = ref(0)

const pngs = ref<unknown>([])
// --- Watch ---
watch(mainFolder, async () => {
  await chunkFiles()
})

const chunkFiles = async () => {
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, 4)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
}

// --- Methods ---
const selectItem = (data: unknown) => {
  store.commit('UPDATE_SELECTED', data)
}

onMounted(async () => {
  ch.value = window.innerHeight
  window.onresize = () => {
    ch.value = window.innerHeight - 100
  }
  await chunkFiles()
})
</script>

<style lang="postcss">
.vue3-virtual-list-item-container {
  @apply flex items-center justify-center;
}
</style>

<style lang="postcss" scoped>
.list-container {
  @apply w-full m-auto;
}
.item-container {
  @apply flex gap-10 justify-center items-center px-[15px];
}
</style>
