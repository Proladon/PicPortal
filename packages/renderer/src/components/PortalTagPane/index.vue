<template>
  <div class="tree-view">
    <section class="flex flex-col min-w-[180px] w-full h-full">
      <div
        class="flex justify-between items-center py-2 mb-5 px-[15px] rounded-md"
      >
        <n-icon
          size="20"
          :class="[
            { transform: viewerSide === 'left' },
            { 'rotate-180': viewerSide === 'left' },
          ]"
          class="cursor-pointer"
          @click="cahngeViewerSide"
          ><EnterSharp
        /></n-icon>
        <n-icon
          size="20"
          class="cursor-pointer"
          @click="showPortalGroupModal = true"
          ><Folder
        /></n-icon>
        <n-icon size="20" class="cursor-pointer"><Search /></n-icon>
      </div>

      <ControlsPane />

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
import PortalGroup from './PortalGroup.vue'
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import ControlsPane from '/@/components/PortalTagPane/ControlsPane.vue'
import { Pricetags, EnterSharp, Search, Folder } from '@vicons/ionicons5'
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

// --- Data ---
const store = useStore()
const drag = ref(false)
const showPortalGroupModal = ref(false)
// --- Computed ---
const viewerSide = computed(() => store.state.viewer.viewerSide)
const portals = computed({
  get: () => store.getters.portals,
  set: async (newData) => {
    const [, error] = await store.dispatch('SAVE_TO_DB', {
      key: 'portals',
      data: newData,
    })
    await store.dispatch('SYNC_DB_TO_STATE', 'portals')
    if (error) alert(error)
  },
})

const cahngeViewerSide = () => {
  console.log(viewerSide.value)
  if (viewerSide.value === 'right') store.commit('SET_VIEWER_SIDE', 'left')
  else if (viewerSide.value === 'left') store.commit('SET_VIEWER_SIDE', 'right')
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
  @apply flex flex-col gap-5 py-3 px-[15px];
}
</style>
