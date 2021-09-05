<template>
  <footer class="status-bar">
    <button class="main-folder-btn" @click="choseMainFolder">
      {{ mainFolder.name || 'Chose Folder' }}
    </button>
  </footer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { useElectron } from '/@/use/electron'

export default defineComponent({
  name: 'StatusBar',
  setup() {
    const { browserDialog } = useElectron()
    const store = useStore()
    const mainFolder = computed(() => store.getters.mainFolder)

    // Methods
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
          store.commit('SET_MAIN_FOLDER', folder)
        }
      } catch (error) {
        console.log(error)
      }
    }

    return {
      choseMainFolder,
      mainFolder,
    }
  },
})
</script>

<style lang="postcss" scoped>
.status-bar {
  @apply flex items-center;
  @apply h-statusbar bg-gray-800;
}

.main-folder-btn {
  @apply h-full px-5 outline-none;
  @apply text-border hover:bg-border hover:text-gray-800;
  transition: ease-in-out 0.3s;
}
</style>
