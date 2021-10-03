<template>
  <footer class="status-bar">
    <n-popover trigger="hover">
      <template #trigger>
        <button class="btn open-project-btn" @click="$router.push('/projects')">
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
          v-if="projectName"
          class="btn main-folder-btn"
          @click="choseMainFolder"
        >
          <n-icon>
            <folder />
          </n-icon>
          <span>{{ mainFolder.name || 'Choose Folder' }}</span>
        </button>
      </template>
      Main Folder
    </n-popover>
  </footer>
</template>

<script lang="ts" setup>
import { NIcon, NPopover } from 'naive-ui'
import { Folder, Cube } from '@vicons/ionicons5'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useElectron } from '/@/use/electron'

const { browserDialog } = useElectron()
const store = useStore()

// --- Computed ---
const mainFolder = computed(() => store.getters.mainFolder || {})
const projectName = computed(() => store.getters.projectName || '')

// --- Methods---
const choseMainFolder = async () => {
  try {
    const res = await browserDialog.open({
      properties: ['openDirectory'],
    })

    if (res.filePaths.length) {
      const chunk = res.filePaths[0].split('\\')
      const folder = {
        name: chunk[chunk.length - 1],
        path: res.filePaths[0].replaceAll('\\', '/'),
      }
      console.log(folder)
      store.dispatch('MAIN_FOLDER', folder)
    }
  } catch (error) {
    console.log(error)
  }
}
</script>

<style lang="postcss" scoped>
.status-bar {
  @apply flex items-center;
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
