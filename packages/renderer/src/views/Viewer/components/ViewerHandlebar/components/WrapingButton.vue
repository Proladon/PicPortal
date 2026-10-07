<template>
  <n-button
    type="success"
    secondary
    class="p-4 cursor-pointer"
    @click="modal.warning = true"
    :disabled="readOnly || wrapingStatus || !dockings.length"
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
import path from 'path-browserify'
import { dataClone } from '/@/utils/data'
import { getFileDir } from '/@/utils/file'
import { useAppStore, DBQueue } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'
import { reactive, computed } from 'vue'
import { useDesktop } from '/@/desktop'
const readOnly = useDesktop().database.readOnly

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
// --- Computed ---
const dockings = computed(() => viewerStore.dockings)
const flattenPortals = computed(() => portalPaneStore.flattenPortals)
const wrapingStatus = computed(() => viewerStore.wrap.wraping)
const modal = reactive({
  warning: false
})
// --- Methods ---
const wraping = async () => {
  modal.warning = false
  if (readOnly || !dockings.value.length) return
  if (wrapingStatus.value) return
  await DBQueue.onIdle()
  const projectDir = getFileDir(useAppStore().openProject?.path || '')
  const items = dataClone(dockings.value).filter(d => d.portals.length).map(dock => ({
    target: dock.target,
    destinations: [...new Set(dock.portals)].map(id => {
      const link = flattenPortals.value.find(p => p.id === id)?.link
      if (!link) return ''
      const normalized = link.replace(/\\/g, '/')
      const folder = /^(?:[a-z]:[\\/]|[\\/])/i.test(link) ? normalized : `${projectDir}/${normalized}`
      const filename = dock.target.replace(/\\/g, '/').split('/').pop()
      // path-browserify uses POSIX normalization; preserve Windows UNC prefix.
      const uncPrefix = folder.startsWith('//') ? '/' : ''
      return uncPrefix + path.normalize(`${folder}/${filename}`)
    })
  }))
  if (items.some(item => item.destinations.some(path => !path))) {
    return alert('部分分類的 Portal 已不存在，請先修正分類')
  }
  await viewerStore.StartBatch(items)
}
</script>

<style scoped lang="postcss"></style>
