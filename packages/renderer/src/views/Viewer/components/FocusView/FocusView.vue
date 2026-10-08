<template>
  <section class="focus-view flex h-full flex-col px-4 pb-4">
    <ViewerState v-if="loading || !pngs.length" :loading="loading" />
    <template v-else>
      <div class="flex shrink-0 items-center justify-center gap-3 pb-3">
        <Button
          class="focus-prev"
          variant="outline"
          size="sm"
          :disabled="curFile === 0"
          @click="curFile--"
        >
          <ChevronLeft />
          {{ t('viewer.focus.previous') }}
        </Button>
        <span
          class="min-w-20 text-center text-sm tabular-nums text-muted-foreground"
        >
          {{ curFile + 1 }} / {{ pngs.length }}
        </span>
        <Button
          class="focus-next"
          variant="outline"
          size="sm"
          :disabled="curFile >= pngs.length - 1"
          @click="curFile++"
        >
          {{ t('viewer.focus.next') }}
          <ChevronRight />
        </Button>
      </div>
      <FocusItem class="min-h-0 flex-1" :img="pngs[curFile].path" />
    </template>
  </section>
</template>

<script lang="ts" setup>
import FocusItem from './components/FocusItem.vue'
import ViewerState from '../ViewerState.vue'
import { ref } from 'vue'
import { map } from 'lodash-es'
import { onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import hotkeys from 'hotkeys-js'
import { Button } from '/@/components/ui/button'
import useViewer from '/@/use/useViewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const { t } = useI18n()
const appStore = useAppStore()
const viewerStore = useViewerStore()
// --- Data ---
const curFile = ref(0)

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  const files = map(showFiles.value, (path) => ({ path: path }))
  pngs.value = files
  curFile.value = 0
  loading.value = false
}

const { loading, pngs, showFiles, mainFolder } = useViewer(0, chunkFiles)

const nextFile = (event: KeyboardEvent) => {
  event.preventDefault()
  if (curFile.value < pngs.value.length - 1) curFile.value++
}
const previousFile = (event: KeyboardEvent) => {
  event.preventDefault()
  if (curFile.value > 0) curFile.value--
}

// --- Watch ---
watch(mainFolder, async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
})

// --- Mounted ---
let disposed = false
onMounted(async () => {
  loading.value = true
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
  loading.value = false
  if (disposed) return
  hotkeys('right', 'viewer', nextFile)
  hotkeys('left', 'viewer', previousFile)
})
onUnmounted(() => {
  disposed = true
  hotkeys.unbind('right', 'viewer', nextFile)
  hotkeys.unbind('left', 'viewer', previousFile)
})
</script>
