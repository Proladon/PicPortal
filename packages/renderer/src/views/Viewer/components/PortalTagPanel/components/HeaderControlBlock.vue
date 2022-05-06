<template>
  <div v-if="!showPortalSearch" class="controls-container">
    <n-button text @click="changePortalPanelPosition">
      <n-icon
        size="20"
        :class="[
          { transform: portalPanelPosition === 'right' },
          { 'rotate-180': portalPanelPosition === 'right' }
        ]"
        class="cursor-pointer"
        ><EnterSharp
      /></n-icon>
    </n-button>
    <n-button text @click="showPortalGroupModal = true">
      <n-icon size="20" class="cursor-pointer"><Folder /></n-icon>
    </n-button>
    <n-button text @click="showPortalSearch = true">
      <n-icon size="20" class="cursor-pointer"><Search /></n-icon>
    </n-button>
  </div>

  <div v-if="showPortalSearch" class="flex mb-[12px]">
    <n-button text class="pr-[5px]" @click="resetSearch">
      <n-icon size="20"><ChevronBack /></n-icon>
    </n-button>
    <n-input placeholder="Search Portal" v-model:value="searchPortalName" />
  </div>

  <PortalGroupModal
    v-if="showPortalGroupModal"
    mode="create"
    @close="showPortalGroupModal = false"
  />
</template>

<script setup lang="ts">
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import { NIcon, NButton, NInput } from 'naive-ui/es'
import { EnterSharp, Folder, Search, ChevronBack } from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

// ANCHOR Use
const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
// ANCHOR Data
const showPortalSearch = ref<boolean>(false)
const showPortalGroupModal = ref<boolean>(false)
// ANCHOR Computed
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
const searchPortalName = computed({
  get: () => portalPaneStore.searchPortalName,
  set: (value: string) => {
    if (!value) portalPaneStore.searchPortalName = ''
    portalPaneStore.searchPortalName = value.trim()
  }
})
// ANCHOR Methods
const changePortalPanelPosition = () => {
  if (portalPanelPosition.value === 'right')
    viewerStore.SET_PORTAL_PANEL_POSITION('left')
  else if (portalPanelPosition.value === 'left')
    viewerStore.SET_PORTAL_PANEL_POSITION('right')
}

const resetSearch = () => {
  portalPaneStore.searchPortalName = ''
  showPortalSearch.value = false
}
</script>

<style scoped lang="postcss">
.controls-container {
  @apply flex justify-between items-center mb-[10px] py-2 rounded-md;
}
</style>
