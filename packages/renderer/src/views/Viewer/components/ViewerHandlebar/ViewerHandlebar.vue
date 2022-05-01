<template>
  <div class="viewer-handlebar">
    <div class="handlebar">
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
          <span v-if="wrapingStatus" class="ml-2 text-gray-300"
            >WRAPING ...</span
          >
        </div>
      </n-tag>

      <QuickActions />
      <n-button class="h-[32px]" ghost @click="showFilter = !showFilter">
        <n-icon size="20"><Filter /></n-icon>
      </n-button>
    </div>
    <ViewerFilter class="right-fixed" v-model:show="showFilter" />
  </div>

  <ModeChangeModal
    v-if="showModeChangeModal"
    @close="showModeChangeModal = false"
  />
</template>

<script lang="ts" setup>
import ModeChangeModal from './components/ModeChangeModal.vue'
import ViewerFilter from './components/ViewerFilter.vue'
import QuickActions from './components/QuickActions.vue'
import { NButton, NIcon, NTag } from 'naive-ui/es'
import { BrowsersOutline, RocketSharp, Filter } from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { forEach, find } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/data'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()

const showModeChangeModal = ref(false)
const showFilter = ref(false)
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
.viewer-handlebar {
  @apply pb-3;
}
.handlebar {
  @apply flex gap-2 justify-center items-center pt-3 rounded-md;
}

.handle-item {
  @apply flex items-center h-[32px];
}
</style>
