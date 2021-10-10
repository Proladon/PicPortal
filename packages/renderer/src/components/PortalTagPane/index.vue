<template>
  <div class="tree-view">
    <div class="bg-border flex justify-between items-center px-5 py-1">
      <div class="flex gap-2 text-gray-800 text-[16px] flex items-center">
        <n-icon><Pricetags /></n-icon>
        <span>Portals Panel</span>
      </div>
      <PortalGroupModal />
      <n-icon size="20" class="cursor-pointer"><EnterSharp /></n-icon>
      <n-icon size="20" class="cursor-pointer"><Search /></n-icon>
    </div>
    <draggable
      class="portal-group-list"
      v-model="portals"
      group="people"
      @start="drag = true"
      @end="drag = false"
      item-key="id"
    >
      <template #item="{ element }">
        <PortalGroup :groupData="element" />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import PortalGroup from './PortalGroup.vue'
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import { Pricetags, EnterSharp, Search } from '@vicons/ionicons5'
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

// --- Data ---
const store = useStore()
const drag = ref(false)

// --- Computed ---
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

// --- Mounted ---
onMounted(async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'portals')
})
</script>

<style lang="postcss" scoped>
.tree-view {
  @apply flex flex-col min-w-[180px];
}

.portal-group-list {
  @apply flex flex-col gap-5 px-4 py-3;
}
</style>
