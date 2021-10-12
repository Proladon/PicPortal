<template>
  <section class="viewer">
    <HandleBar />
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
            <template v-slot="{ item, index }">
              <div
                class="item-container"
                :style="`grid-template-columns: repeat(${column}, 1fr);`"
              >
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
    </n-spin>
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
import { NSpin } from 'naive-ui'

// --- Data ---
const store = useStore()
const ch = ref(0)
const loading = ref(false)
const column = ref(5)
// --- Computed ---
const mainFolder = computed(() => store.getters.mainFolder)
const folderFiles = computed(() => store.state.viewer.folderFiles)
const activedPortals = computed(() => store.getters.activedPortals)
const dockings = computed(() => store.getters.dockings)

const pngs = ref<unknown>([])
// --- Watch ---
watch(mainFolder, async () => {
  loading.value = true
  await chunkFiles()
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  loading.value = false
})

// --- Methods ---
const chunkFiles = async () => {
  await store.dispatch('GET_FOLDER_ALL_FILES')
  const files = map(folderFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, column.value)
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

  const dockingsRef = dataClone(dockings.value)
  const activedPortalsRef: ActivedPortals[] = dataClone(activedPortals.value)

  const dockingsData = {
    target,
    portals: map(activedPortalsRef, 'id'),
  }
  const isExist = findIndex(dockingsRef, { target: target })

  if (isExist >= 0) dockingsRef[isExist] = dockingsData
  if (isExist < 0) dockingsRef.push(dockingsData)

  await store.dispatch('DOCKING', {
    key: 'dockings',
    data: dockingsRef,
  })
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
}

// --- Mounted ---
onMounted(async () => {
  loading.value = true
  ch.value = window.innerHeight
  ch.value = window.innerHeight - 100
  window.onresize = () => {
    ch.value = window.innerHeight - 100
  }
  await chunkFiles()
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
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
