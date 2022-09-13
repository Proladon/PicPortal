<template>
  <n-tag
    type="warning"
    class="p-4 cursor-pointer"
    @click="wraping"
    :disabled="wrapingStatus || !dockings.length"
  >
    <div class="handle-item">
      <n-icon><RocketSharp /></n-icon>
      <span v-if="!wrapingStatus" class="ml-2 text-gray-300">{{
        translate('viewer.warpingBtn.label')
      }}</span>
      <span v-if="wrapingStatus" class="ml-2 text-gray-300">{{
        translate('viewer.warpingBtn.warping')
      }}</span>
    </div>
  </n-tag>
</template>

<script setup lang="ts">
import { NTag, NIcon } from 'naive-ui'
import { RocketSharp } from '@vicons/ionicons5'
import { useViewerStore } from '/@/store/viewerStore'
import { computed } from '@vue/reactivity'
import { forEach, find } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/data'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
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
        destPath: targetFolder.replace(/\\/g, '/') + '/' + getFileName(src),
      })
    })
    waitRemove.push(src)
  })
  viewerStore.UpdatePullList(waitRemove)
  viewerStore.PurgeFiles(waitRemove)
  viewerStore.StartWraping()
}
</script>

<style scoped lang="postcss"></style>
