<template>
  <footer class="status-bar">
    <div class="h-full flex-center-items">
      <n-popover trigger="hover">
        <template #trigger>
          <button
            class="btn open-project-btn"
            @click="$router.push('/projects')"
          >
            <n-icon>
              <cube />
            </n-icon>
            <span>{{ projectName || 'Open Project' }}</span>
          </button>
        </template>
        Project
      </n-popover>

      <n-popover trigger="hover">
        <template #trigger>
          <button
            v-show="projectName"
            class="btn main-folder-btn"
            @click="changeMainFolder"
          >
            <n-icon>
              <folder />
            </n-icon>
            <span>{{ mainFolder.name || 'Choose Folder' }}</span>
          </button>
        </template>
        Main Folder
      </n-popover>

      <n-popover trigger="hover">
        <template #trigger>
          <div class="btn main-folder-btn cursor-default">
            <n-icon>
              <DocumentOutline />
            </n-icon>
            <span>{{ filesCount }}</span>
          </div>
        </template>
        Files Count
      </n-popover>
    </div>

    <div class="h-full flex">
      <div class="w-[250px] flex gap-5 px-5 items-center justify-center">
        <n-progress
          :processing="wrapingStatus"
          type="line"
          status="success"
          :percentage="(curWrap / totalWrap) * 100"
        >
          <span>{{ curWrap }} / {{ totalWrap }}</span>
        </n-progress>

        <span class="text-rose-300">{{ errWrap }}</span>
      </div>
      <div class="btn open-project-btn">
        <n-icon size="20"><Book /></n-icon>
      </div>
    </div>
  </footer>

  <WarningModal
    v-if="showWarningModal"
    title="Warning"
    :content="translate('statusbar.warning.content')"
    @close="showWarningModal = false"
    @confirm="choseMainFolder"
  />
</template>

<script lang="ts" setup>
import WarningModal from '/@/components/Modal/WarningModal.vue'
import { NIcon, NPopover, NProgress } from 'naive-ui'
import { Folder, Cube, DocumentOutline, Book } from '@vicons/ionicons5'
import { computed, ref } from 'vue'
import { useElectron } from '/@/use/electron'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { getFileName } from '/@/utils/file'
import useLocale from '/@/use/locale'

// ANCHOR Use
const { browserDialog } = useElectron()
const appStore = useAppStore()
const viewerStore = useViewerStore()
const { translate } = useLocale()

const showWarningModal = ref(false)

// --- Computed ---
const mainFolder = computed(() => appStore.projectMainFolder)
const projectName = computed(() => appStore.projectName)
const filesCount = computed(() => viewerStore.folderFilesCount)
const totalWrap = computed(() => viewerStore.wrap.totalWrap)
const curWrap = computed(() => viewerStore.wrap.curWrap)
const errWrap = computed(() => viewerStore.wrap.errWrap)
const wrapingStatus = computed(() => viewerStore.wrap.wraping)

// --- Methods---
const choseMainFolder = async () => {
  showWarningModal.value = false
  try {
    const res = await browserDialog.open({
      properties: ['openDirectory'],
    })

    if (res.filePaths.length) {
      const folder = {
        name: getFileName(res.filePaths[0]),
        path: res.filePaths[0].replaceAll('\\', '/'),
      }
      await appStore.SaveToDB({ key: 'mainFolder', data: folder })
      await appStore.SaveToDB({ key: 'dockings', data: [] })
      await appStore.SyncDBDataToState({
        syncKeys: ['mainFolder', 'dockings'],
      })
    }
  } catch (error) {
    console.log(error)
  }
}

const changeMainFolder = () => {
  if (mainFolder.value.name) {
    showWarningModal.value = true
    return
  }
  choseMainFolder()
}
</script>

<style lang="postcss" scoped>
.status-bar {
  @apply flex items-center justify-between;
  @apply h-statusbar bg-variant-bg;
}

.main-folder-btn,
.open-project-btn {
  @apply h-full px-5 outline-none;
  @apply text-base hover:(text-primary);
  transition: ease-in-out 0.3s;
}

.btn {
  @apply flex items-center gap-[5px];
}
</style>
