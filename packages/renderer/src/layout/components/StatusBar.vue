<template>
  <footer
    class="status-bar flex h-7 shrink-0 select-none items-center justify-between gap-4 border-t border-sidebar-border bg-sidebar px-1 text-xs text-muted-foreground"
  >
    <div class="flex h-full min-w-0 items-center">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="btn open-project-btn"
            :disabled="wrapingStatus"
            @click="$router.push('/projects')"
          >
            <Box class="size-3.5" />
            <span class="truncate">{{
              projectName || t('statusbar.openProject')
            }}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{{ t('statusbar.project') }}</TooltipContent>
      </Tooltip>

      <Badge
        v-if="appStore.readOnly && projectName"
        variant="outline"
        class="read-only-status mx-1 h-4 border-warning/40 px-1.5 text-[10px] text-warning"
      >
        <Lock />
        {{ t('statusbar.readOnly') }}
      </Badge>

      <Tooltip v-if="projectName">
        <TooltipTrigger as-child>
          <button
            type="button"
            class="btn main-folder-btn"
            :disabled="wrapingStatus"
            @click="changeMainFolder"
          >
            <Folder class="size-3.5" />
            <span class="truncate">{{
              mainFolder.name || t('statusbar.chooseFolder')
            }}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="max-w-md break-all">
          {{ mainFolder.path || t('statusbar.mainFolder') }}
        </TooltipContent>
      </Tooltip>

      <Tooltip v-if="mainFolder.path">
        <TooltipTrigger as-child>
          <div class="btn cursor-default">
            <ImageIcon class="size-3.5" />
            <span class="tabular-nums">{{ filesCount }}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">{{
          t('statusbar.filesCount')
        }}</TooltipContent>
      </Tooltip>
    </div>

    <div
      v-if="totalWrap"
      class="wrap-progress flex h-full shrink-0 items-center gap-2.5 px-2"
      :title="t('statusbar.progress')"
    >
      <Spinner v-if="wrapingStatus" class="size-3.5 text-primary" />
      <CircleCheck v-else class="size-3.5 text-success" />
      <Progress :model-value="progress" class="h-1.5 w-32" />
      <span class="tabular-nums text-foreground"
        >{{ curWrap }} / {{ totalWrap }}</span
      >
      <span v-if="errWrap" class="text-destructive">
        {{ t('statusbar.failed', { count: errWrap }) }}
      </span>
      <span v-if="viewerStore.wrap.skipWrap">
        {{ t('statusbar.skipped', { count: viewerStore.wrap.skipWrap }) }}
      </span>
    </div>
  </footer>

  <ConfirmDialog
    v-if="showWarningModal"
    :title="t('statusbar.warning.title')"
    :content="t('statusbar.warning.content')"
    @close="showWarningModal = false"
    @confirm="choseMainFolder"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Box, CircleCheck, Folder, Image as ImageIcon, Lock } from '@lucide/vue'
import ConfirmDialog from '/@/components/ConfirmDialog.vue'
import { Badge } from '/@/components/ui/badge'
import { Progress } from '/@/components/ui/progress'
import { Spinner } from '/@/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { useDesktop } from '/@/desktop'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { useMainFolder } from '/@/use/mainFolder'

// ANCHOR Use
const { database } = useDesktop()
const appStore = useAppStore()
const viewerStore = useViewerStore()
const { t } = useI18n()

const showWarningModal = ref(false)

// --- Computed ---
const mainFolder = computed(() => appStore.projectMainFolder)
const projectName = computed(() => appStore.projectName)
const filesCount = computed(() => viewerStore.folderFilesCount)
const totalWrap = computed(() => viewerStore.wrap.totalWrap)
const curWrap = computed(() => viewerStore.wrap.curWrap)
const errWrap = computed(() => viewerStore.wrap.errWrap)
const wrapingStatus = computed(() => viewerStore.wrap.wraping)
const progress = computed(() =>
  totalWrap.value
    ? ((curWrap.value + errWrap.value + viewerStore.wrap.skipWrap) /
        totalWrap.value) *
      100
    : 0
)

// --- Methods---
const { choseMainFolder: pickMainFolder } = useMainFolder()
const choseMainFolder = () => {
  showWarningModal.value = false
  return pickMainFolder()
}

const changeMainFolder = () => {
  if (viewerStore.wrap.wraping) return
  if (database.readOnly) return choseMainFolder()
  if (mainFolder.value.name) {
    showWarningModal.value = true
    return
  }
  choseMainFolder()
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  height: 100%;
  min-width: 0;
  max-width: 16rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.625rem;
  outline: none;
  transition: background-color 0.15s, color 0.15s;
}
button.btn:hover:not(:disabled) {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}
button.btn:focus-visible {
  box-shadow: inset 0 0 0 1px var(--ring);
}
button.btn:disabled {
  opacity: 0.5;
}
</style>
