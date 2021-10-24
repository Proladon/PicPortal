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
        <span class="ml-2 text-gray-300">START !</span>
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
import { map, forEach, find } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/data'

const showModeChangeModal = ref(false)
const store = useStore()
const dockings = computed(() => store.getters.dockings)
const flattenPortals = computed(() => store.getters.flattenPortals)

const wraping = async () => {
  const dockingsData = dataClone(dockings.value)

  forEach(dockingsData, (dock) => {
    const src = dock.target
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
      })
    })
  })
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
