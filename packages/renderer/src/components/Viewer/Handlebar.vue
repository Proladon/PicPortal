<template>
  <section class="viewer-handle-bar">
    <n-tag
      type="info"
      class="p-4 cursor-pointer"
      @click="showModeChangeModal = true"
    >
      <div class="handle-item">
        <n-icon><BrowsersOutline /></n-icon>
        <span class="ml-2 text-gray-300">Multiple</span>
      </div>
    </n-tag>

    <n-tag type="warning" class="p-4 cursor-pointer">
      <div class="handle-item">
        <n-icon><BrowsersOutline /></n-icon>
        <span class="ml-2 text-gray-300">Portals > Pics</span>
      </div>
    </n-tag>

    <n-tag type="warning" class="p-4 cursor-pointer" @click="wraping">
      <div class="handle-item">
        <n-icon><RocketSharp /></n-icon>
        <span v-if="!wrapingStatus" class="ml-2 text-gray-300">START !</span>
        <span v-if="wrapingStatus" class="ml-2 text-gray-300">WRAPING ...</span>
      </div>
    </n-tag>
  </section>

  <ModeChangeModal
    v-if="showModeChangeModal"
    @close="showModeChangeModal = false"
  />
</template>

<script lang="ts" setup>
import ModeChangeModal from './Modal/ModeChangeModal.vue'
import { NIcon, NTag } from 'naive-ui'
import { BrowsersOutline, RocketSharp } from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { map, forEach, find, findIndex } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/data'

const showModeChangeModal = ref(false)
const store = useStore()
// --- Computed ---
const dockings = computed(() => store.getters.dockings)
const flattenPortals = computed(() => store.getters.flattenPortals)
const wrapingStatus = computed(() => store.state.viewer.wraping)

// --- Methods ---
const wraping = async () => {
  if (wrapingStatus.value) return
  const dockingsData = dataClone(dockings.value)
  const waitRemove = []
  forEach(dockingsData, async (dock) => {
    const src = dock.target
    const dockIndex = findIndex(dockings.value, { target: dock.target })
    let count = 0
    forEach(dock.portals, async (portal) => {
      count += 1
      const targetFolder = find(
        flattenPortals.value,
        (item) => item.id === portal
      ).link

      await store.dispatch('WRAPING', {
        mode: count === dock.portals.length ? 'move' : 'copy',
        filePath: src,
        destPath: targetFolder.replace(/\\/g, '/') + '/' + getFileName(src),
        dockIndex,
      })
    })
    waitRemove.push(src)
  })
  store.commit('UPDATE_PULL_LIST', waitRemove)
  store.commit('PURGE_FILES', waitRemove)
  await store.dispatch('START_WRAPING')
}
</script>

<style lang="postcss" scoped>
.viewer-handle-bar {
  @apply flex gap-2 justify-center items-center;
}

.handle-item {
  @apply flex items-center;
}
</style>
