<template>
  <div class="tree-view">
    <section class="flex flex-col min-w-[180px] full">
      <div
        class="flex justify-between items-center py-2 mb-5 px-[15px] rounded-md"
      >
        <n-button text>
          <n-icon
            size="20"
            :class="[
              { transform: portalPanelPosition === 'right' },
              { 'rotate-180': portalPanelPosition === 'right' }
            ]"
            class="cursor-pointer"
            @click="changePortalPanelPosition"
            ><EnterSharp
          /></n-icon>
        </n-button>
        <n-button text>
          <n-icon
            size="20"
            class="cursor-pointer"
            @click="showPortalGroupModal = true"
            ><Folder
          /></n-icon>
        </n-button>
      </div>

      <ControlsBlock />

      <PortalGroupList />

      <PortalGroupModal
        v-if="showPortalGroupModal"
        mode="create"
        @close="showPortalGroupModal = false"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import PortalGroupList from './components/PortalGroupList.vue'
import PortalGroupModal from './components/Modal/PortalGroupModal.vue'
import ControlsBlock from './components/ControlsBlock.vue'
import { EnterSharp, Folder } from '@vicons/ionicons5'
import { NIcon, NButton } from 'naive-ui/es'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useViewerStore } from '/@/store/viewerStore'
import { useAppStore } from '/@/store/appStore'

// ANCHOR Use
const appStore = useAppStore()
const viewerStore = useViewerStore()
// ANCHOR Data
const showPortalGroupModal = ref(false)
// ANCHOR Computed
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)

// ANCHOR Methods
const changePortalPanelPosition = () => {
  if (portalPanelPosition.value === 'right')
    viewerStore.SET_PORTAL_PANEL_POSITION('left')
  else if (portalPanelPosition.value === 'left')
    viewerStore.SET_PORTAL_PANEL_POSITION('right')
}

// ANCHOR Mounted
onMounted(async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
})
</script>

<style lang="postcss" scoped>
.tree-view {
  @apply flex pt-[10px] min-w-[250px] px-[20px] h-full;
}

.portal-group-list {
  @apply flex flex-col py-3 px-[15px];
}
</style>
