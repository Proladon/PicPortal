<template>
  <n-button
    type="success"
    secondary
    class="p-4 cursor-pointer"
    @click="modal.warning = true"
    :disabled="wrapingStatus || !dockings.length"
  >
    <div class="handle-item">
      <n-icon><RocketSharp /></n-icon>
      <span v-if="!wrapingStatus" class="ml-2 text-success">
        {{ translate('viewer.warpingBtn.label') }}
      </span>
      <span v-if="wrapingStatus" class="ml-2 text-gray-300">
        {{ translate('viewer.warpingBtn.warping') }}
      </span>
    </div>
  </n-button>

  <WarningModal
    v-if="modal.warning"
    type="info"
    @close="modal.warning = false"
    @confirm="wraping"
  >
    確認要開始傳送檔案?
  </WarningModal>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import WarningModal from '/@/components/Modal/WarningModal.vue'
import { RocketSharp } from '@vicons/ionicons5'
import { useViewerStore } from '/@/store/viewerStore'
import { forEach, find } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/data'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'
import { reactive, computed } from 'vue'

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
// --- Computed ---
const dockings = computed(() => viewerStore.dockings)
const flattenPortals = computed(() => portalPaneStore.flattenPortals)
const wrapingStatus = computed(() => viewerStore.wrap.wraping)
const modal = reactive({
  warning: false,
})
// --- Methods ---
const wraping = async () => {
  modal.warning = false
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
  viewerStore.StartWraping('normal')
}
</script>

<style scoped lang="postcss"></style>
