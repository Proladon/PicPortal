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
import HandleBar from '/@/components/Viewer/Handlebar.vue'
import ImageItem from '/@/components/Viewer/ImageItem.vue'
import { VirtualList } from 'vue3-virtual-list'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { chunk, map, findIndex } from 'lodash-es'
import { onMounted, watch } from '@vue/runtime-core'
import { dataClone } from '/@/utils/data'
// --- Data ---
const store = useStore()
const ch = ref(0)

// --- Computed ---
const mainFolder = computed(() => store.getters.mainFolder)
const folderFiles = computed(() => store.state.viewer.folderFiles)
const activedPortals = computed(() => store.getters.activedPortals)
const docking = computed(() => store.getters.docking)

const pngs = ref<unknown>([])
// --- Watch ---
watch(mainFolder, async () => {
  await chunkFiles()
  await store.dispatch('SYNC_DB_TO_STATE', 'docking')
})

// --- Methods ---
const chunkFiles = async () => {
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, 4)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
}

const selectItem = async (e, row: unknown) => {
  const ignore = ['I', 'path', 'svg']
  const htmlTarget = e.target.tagName
  if (ignore.includes(htmlTarget)) return
  if (!activedPortals.value.length) return

  const rowImgs = row.item.src
  const index = row.childIndex
  const target = rowImgs[index].path

  const dockingRef = dataClone(docking.value)
  const activedPortalsRef: ActivedPortals[] = dataClone(activedPortals.value)

  const dockingData = {
    target,
    portals: map(activedPortalsRef, 'id'),
  }
  const isExist = findIndex(dockingRef, { target: target })

  if (isExist >= 0) dockingRef[isExist] = dockingData
  if (isExist < 0) dockingRef.push(dockingData)

  await store.dispatch('DOCKING', {
    key: 'docking',
    data: dockingRef,
  })
  await store.dispatch('SYNC_DB_TO_STATE', 'docking')
}

// --- Mounted ---
onMounted(async () => {
  ch.value = window.innerHeight
  window.onresize = () => {
    ch.value = window.innerHeight - 100
  }
  await chunkFiles()
  await store.dispatch('SYNC_DB_TO_STATE', 'docking')
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
