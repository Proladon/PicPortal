<template>
  <div class="tree-view">
    <section class="flex flex-col min-w-[180px] w-full h-full">
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
        <n-button text>
          <n-icon size="20" class="cursor-pointer"><Search /></n-icon>
        </n-button>
      </div>

      <ControlsBlock />

      <div class="overflow-y-auto">
        <Draggable
          class="portal-group-list"
          v-model="portals"
          item-key="id"
          :animation="300"
        >
          <template #item="{ element }">
            <PortalGroup :groupData="element" />
          </template>
        </Draggable>
      </div>

      <PortalGroupModal
        v-if="showPortalGroupModal"
        mode="create"
        @close="showPortalGroupModal = false"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import Draggable from 'vuedraggable'
import PortalGroup from './components/PortalGroup.vue'
import PortalGroupModal from './components/Modal/PortalGroupModal.vue'
import ControlsBlock from './components/ControlsBlock.vue'
import { EnterSharp, Search, Folder } from '@vicons/ionicons5'
import { NIcon, NButton } from 'naive-ui/es'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useViewerStore } from '/@/store/viewerStore'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

// ANCHOR Use
const appStore = useAppStore()
const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
// ANCHOR Data
const drag = ref(false)
const showPortalGroupModal = ref(false)
// ANCHOR Computed
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
const portals = computed({
  get: () => portalPaneStore.portals,
  set: async (newData) => {
    const [, error] = await appStore.SaveToDB({ key: 'portals', data: newData })
    await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
    if (error) alert(error)
  }
})
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
