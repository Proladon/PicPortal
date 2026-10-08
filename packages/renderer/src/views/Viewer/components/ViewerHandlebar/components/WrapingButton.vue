<template>
  <Button
    class="wrap-btn gap-2"
    size="sm"
    :disabled="readOnly || wrapingStatus || !dockings.length"
    @click="modal.warning = true"
  >
    <Spinner v-if="wrapingStatus" />
    <Rocket v-else />
    <span v-if="!wrapingStatus">{{ t('viewer.warpingBtn.label') }}</span>
    <span v-else>{{ t('viewer.warpingBtn.warping') }}</span>
    <span
      class="rounded-sm bg-primary-foreground/15 px-1.5 text-xs tabular-nums"
      :title="t('viewer.toolbar.dockings', { count: dockings.length })"
    >
      {{ dockings.length }}
    </span>
  </Button>

  <ConfirmDialog
    v-if="modal.warning"
    type="default"
    :title="t('viewer.wrapConfirm.title')"
    :content="t('viewer.wrapConfirm.content')"
    @close="modal.warning = false"
    @confirm="wraping"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Rocket } from '@lucide/vue'
import ConfirmDialog from '/@/components/ConfirmDialog.vue'
import { Button } from '/@/components/ui/button'
import { Spinner } from '/@/components/ui/spinner'
import { useViewerStore } from '/@/store/viewerStore'
import path from 'path-browserify'
import { dataClone } from '/@/utils/data'
import { getFileDir } from '/@/utils/file'
import { useAppStore, DBQueue } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { reactive, computed } from 'vue'
import { useDesktop } from '/@/desktop'
const readOnly = useDesktop().database.readOnly

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
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
  if (readOnly || !dockings.value.length) return
  if (wrapingStatus.value) return
  await DBQueue.onIdle()
  const projectDir = getFileDir(useAppStore().openProject?.path || '')
  const items = dataClone(dockings.value)
    .filter((d) => d.portals.length)
    .map((dock) => ({
      target: dock.target,
      destinations: [...new Set(dock.portals)].map((id) => {
        const link = flattenPortals.value.find((p) => p.id === id)?.link
        if (!link) return ''
        const normalized = link.replace(/\\/g, '/')
        const folder = /^(?:[a-z]:[\\/]|[\\/])/i.test(link)
          ? normalized
          : `${projectDir}/${normalized}`
        const filename = dock.target.replace(/\\/g, '/').split('/').pop()
        // path-browserify uses POSIX normalization; preserve Windows UNC prefix.
        const uncPrefix = folder.startsWith('//') ? '/' : ''
        return uncPrefix + path.normalize(`${folder}/${filename}`)
      }),
    }))
  if (items.some((item) => item.destinations.some((path) => !path))) {
    return toast.error(t('viewer.notify.missingPortal'))
  }
  await viewerStore.StartBatch(items)
}
</script>
