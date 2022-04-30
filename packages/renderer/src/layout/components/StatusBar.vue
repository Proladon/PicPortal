<template>
  <footer class="status-bar">
    <div class="flex items-center justify-center">
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
            @click="showWarningModal = true"
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
  </footer>

  <WarningModal
    v-if="showWarningModal"
    title="Warning"
    @close="showWarningModal = false"
    @confirm="choseMainFolder"
  >
    <div>Changing Mainfolder will lose all of the current dockings !</div>
  </WarningModal>
</template>

<script lang="ts" setup>
import WarningModal from './WarningModal.vue'
import { NIcon, NPopover, NProgress } from 'naive-ui'
import { Folder, Cube, DocumentOutline } from '@vicons/ionicons5'
import { computed, ref } from 'vue'
import { useElectron } from '/@/use/electron'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

// ANCHOR Use
const { browserDialog } = useElectron()
const appStore = useAppStore()
const viewerStore = useViewerStore()

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
  try {
    const res = await browserDialog.open({
      properties: ['openDirectory']
    })

    if (res.filePaths.length) {
      const chunk = res.filePaths[0].split('\\')
      const folder = {
        name: chunk[chunk.length - 1],
        path: res.filePaths[0].replaceAll('\\', '/')
      }
      console.log(folder)
      await appStore.SaveToDB({ key: 'mainFolder', data: folder })
      await appStore.SaveToDB({ key: 'dockings', data: [] })
      await appStore.SyncDBDataToState({
        syncKeys: ['mainFolder', 'dockings']
      })
    }
  } catch (error) {
    console.log(error)
  }
}
</script>

<style lang="postcss" scoped>
.status-bar {
  @apply flex items-center justify-between;
  @apply h-statusbar bg-gray-800;
}

.main-folder-btn,
.open-project-btn {
  @apply h-full px-5 outline-none;
  @apply text-border hover:bg-border hover:text-gray-800;
  transition: ease-in-out 0.3s;
}

.btn {
  @apply flex items-center gap-[5px];
}
</style>
