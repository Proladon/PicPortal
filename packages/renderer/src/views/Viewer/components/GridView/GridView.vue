<template>
  <ViewerState v-if="loading || !pngs.length" :loading="loading" />
  <div v-else class="flex h-full flex-col">
    <div class="grid-view min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
      <div
        class="list-container grid gap-3"
        :style="`grid-template-columns: repeat(auto-fill, minmax(${imgSize}px, 1fr));`"
      >
        <GridItem
          v-for="item in itemsList"
          :key="item.path"
          :img="item.path"
          @click="selectItem($event, item)"
        />
      </div>
    </div>
    <div
      v-if="pngs.length > 1"
      class="pagination-container flex shrink-0 items-center gap-3 border-t px-4 py-1.5"
    >
      <span class="w-28 shrink-0 text-xs text-muted-foreground tabular-nums">
        {{ t('viewer.pagination.summary', { page, total: pngs.length }) }}
      </span>
      <Pagination
        v-slot="{ page: current }"
        v-model:page="page"
        :total="pngs.length"
        :items-per-page="1"
        :sibling-count="1"
        show-edges
        class="min-w-0 flex-1"
      >
        <PaginationContent v-slot="{ items }">
          <PaginationPrevious
            size="sm"
            :aria-label="t('viewer.pagination.previous')"
          >
            <ChevronLeft />
          </PaginationPrevious>
          <template v-for="(pageItem, index) in items" :key="index">
            <PaginationItem
              v-if="pageItem.type === 'page'"
              :value="pageItem.value"
              :is-active="pageItem.value === current"
              size="icon-sm"
              class="tabular-nums"
            >
              {{ pageItem.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :index="index" />
          </template>
          <PaginationNext size="sm" :aria-label="t('viewer.pagination.next')">
            <ChevronRight />
          </PaginationNext>
        </PaginationContent>
      </Pagination>
      <label
        class="flex w-28 shrink-0 items-center justify-end gap-2 text-xs text-muted-foreground"
      >
        {{ t('viewer.pagination.jump') }}
        <Input
          type="number"
          class="h-7 w-14 px-2 text-xs tabular-nums"
          :min="1"
          :max="pngs.length"
          @keydown.enter="jumpTo"
        />
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import GridItem from './components/GridItem.vue'
import ViewerState from '../ViewerState.vue'
import { computed } from 'vue'
import { onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { Input } from '/@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '/@/components/ui/pagination'
import useViewer from '/@/use/useViewer'
import { chunk, map, get } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import hotkeys from 'hotkeys-js'

const { t } = useI18n()
const appStore = useAppStore()
const viewerStore = useViewerStore()

const imgSize = computed(() => viewerStore.gridView.imgSize)
const itemsList = computed(() => {
  const list = get(pngs.value[page.value - 1], 'src')
  if (!list) return get(pngs.value[0], 'src', [])
  // FIXME set page to 0
  return list
})

// --- Methods ---
const chunkFiles = async () => {
  loading.value = true
  await viewerStore.GetFolderAllFiles({})
  const files = map(showFiles.value, (path) => ({ path: path }))
  const filesChunkList = chunk(files, viewerStore.gridView.perPage)
  const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
  pngs.value = newData
  loading.value = false
}

const { loading, pngs, page, mainFolder, selectItem, showFiles } = useViewer(
  20,
  chunkFiles
)

const jumpTo = (event: KeyboardEvent) => {
  const input = event.target as HTMLInputElement
  const target = Math.round(Number(input.value))
  if (target >= 1 && target <= pngs.value.length) page.value = target
  input.value = ''
}

// --- Watch ---
watch(mainFolder, async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
})

// --- Mounted ---
let disposed = false
onMounted(async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  await chunkFiles()
  if (disposed) return
  viewerStore.signal.refresh = false

  hotkeys('right', 'viewer', nextPage)
  hotkeys('left', 'viewer', previousPage)
})
const nextPage = (event: KeyboardEvent) => {
  event.preventDefault()
  if (page.value < pngs.value.length) page.value++
}
const previousPage = (event: KeyboardEvent) => {
  event.preventDefault()
  if (page.value > 1) page.value--
}
onUnmounted(() => {
  disposed = true
  hotkeys.unbind('right', 'viewer', nextPage)
  hotkeys.unbind('left', 'viewer', previousPage)
})
</script>
