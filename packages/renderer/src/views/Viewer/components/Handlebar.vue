<template>
  <section class="viewer-handle-bar">
    <n-tag
      type="info"
      class="p-4 cursor-pointer"
      @click="showModeChangeModal = true"
    >
      <div class="handle-item">
        <n-icon><BrowsersOutline /></n-icon>
        <span class="ml-2 text-gray-300">{{ $route.name }}</span>
      </div>
    </n-tag>

    <n-tag
      type="warning"
      class="p-4 cursor-pointer"
      @click="wraping"
      :disabled="wrapingStatus || !dockings.length"
    >
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
import ModeChangeModal from './ModeChangeModal.vue'
import { NIcon, NTag } from 'naive-ui'
import { BrowsersOutline, RocketSharp } from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { forEach, find } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/data'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()

const showModeChangeModal = ref(false)
// --- Computed ---
const dockings = computed(() => viewerStore.dockings)
const flattenPortals = computed(() => portalPaneStore.flattenPortals)
const wrapingStatus = computed(() => viewerStore.wrap.wraping)

// --- Methods ---
const wraping = async () => {
  if (!dockings.value.length) return
  if (wrapingStatus.value) return
  const dockingsData = dataClone(dockings.value)
  const waitRemove = []
  forEach(dockingsData, async (dock) => {
    const src = dock.target
    let count = 0
    forEach(dock.portals, async (portal) => {
      count += 1
      const targetFolder = find(
        flattenPortals.value,
        (item) => item.id === portal
      ).link

      await viewerStore.Wraping({
        mode: count === dock.portals.length ? 'move' : 'copy',
        filePath: src,
        destPath: targetFolder.replace(/\\/g, '/') + '/' + getFileName(src)
      })
    })
    waitRemove.push(src)
  })
  viewerStore.UpdatePullList(waitRemove)
  viewerStore.PurgeFiles(waitRemove)
  viewerStore.StartWraping()
}
</script>

<style lang="postcss" scoped>
.viewer-handle-bar {
  @apply flex gap-2 justify-center items-center p-3 rounded-md;
}

.handle-item {
  @apply flex items-center;
}
</style>
