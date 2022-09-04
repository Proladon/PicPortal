<template>
  <div class="viewer">
    <splitpanes v-if="portalPanelPosition === 'right'">
      <pane>
        <router-view></router-view>
      </pane>
      <pane size="30">
        <PortalTagPanel />
      </pane>
    </splitpanes>

    <splitpanes v-if="portalPanelPosition === 'left'">
      <pane size="30">
        <PortalTagPanel />
      </pane>
      <pane>
        <router-view></router-view>
      </pane>
    </splitpanes>
  </div>
  <FileExistModal
    :data="filesExist"
    v-if="showFileExistModal"
    @close="handleFileExistModalClose"
  />

  <OpenProjectModal v-if="showOpenProjectModal" />
</template>

<script setup lang="ts">
import OpenProjectModal from '/@/views/Viewer/components/OpenProjectModal.vue'
import FileExistModal from '/@/components/Modal/FileExistModal.vue'
import PortalTagPanel from './components/PortalTagPanel/PortalTagPanel.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useViewerStore } from '/@/store/viewerStore'
import { computed, ref } from '@vue/reactivity'
import { onMounted, watchEffect } from 'vue'
import { useAppStore } from '/@/store/appStore'

const appStore = useAppStore()
const viewerStore = useViewerStore()
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
const showOpenProjectModal = ref<boolean>(false)
const showFileExistModal = ref<boolean>(false)
const filesExistCount = computed(() => viewerStore.wrap.filesExist.length)
const filesExist = computed(() => viewerStore.wrap.filesExist[0] || {})

watchEffect(() => {
  if (filesExistCount.value > 0) {
    setTimeout(() => {
      showFileExistModal.value = true
    }, 400)
  } else showFileExistModal.value = false
})

const handleFileExistModalClose = () => {
  if (!filesExistCount.value) return
  viewerStore.wrap.filesExist.shift()
  showFileExistModal.value = false
}

onMounted(() => {
  if (!appStore.openProject) showOpenProjectModal.value = true
})
</script>

<style scoped lang="postcss">
.viewer {
  @apply w-full h-full;
}
</style>
