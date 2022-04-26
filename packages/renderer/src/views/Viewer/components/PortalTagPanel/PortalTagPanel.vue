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
import { NIcon, NEllipsis, NCheckbox, NButton } from 'naive-ui/es'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useViewerStore } from '/@/store/viewerStore'

// --- Data ---
const viewerStore = useViewerStore()
const store = useStore()
const drag = ref(false)
const showPortalGroupModal = ref(false)
// --- Computed ---
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
const portals = computed({
  get: () => store.getters.portals,
  set: async (newData) => {
    const [, error] = await store.dispatch('SAVE_TO_DB', {
      key: 'portals',
      data: newData
    })
    await store.dispatch('SYNC_DB_TO_STATE', 'portals')
    if (error) alert(error)
  }
})

const changePortalPanelPosition = () => {
  if (portalPanelPosition.value === 'right')
    viewerStore.SET_PORTAL_PANEL_POSITION('left')
  else if (portalPanelPosition.value === 'left')
    viewerStore.SET_PORTAL_PANEL_POSITION('right')
}

// --- Mounted ---
onMounted(async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'portals')
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
