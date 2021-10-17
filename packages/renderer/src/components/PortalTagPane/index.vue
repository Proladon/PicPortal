<template>
  <div class="tree-view">
    <section class="bg-[var(--primary-bg-2)] flex flex-col w-[80px] h-full">
      dfas
    </section>

    <section class="flex flex-col min-w-[180px] w-full h-full">
      <div class="bg-border flex justify-between items-center px-5 py-1">
        <div class="flex gap-2 text-[16px] flex items-center">
          <n-icon><Pricetags /></n-icon>
          <span class="text-gray-800">Portals</span>
        </div>

        <n-icon
          color="var(--primary-bg-1)"
          size="20"
          class="cursor-pointer"
          @click="showPortalGroupModal = true"
          ><Folder
        /></n-icon>
        <n-icon color="var(--primary-bg-1)" size="20" class="cursor-pointer"
          ><EnterSharp
        /></n-icon>
        <n-icon color="var(--primary-bg-1)" size="20" class="cursor-pointer"
          ><Search
        /></n-icon>
      </div>

      <draggable
        class="portal-group-list"
        v-model="portals"
        item-key="id"
        :animation="300"
      >
        <template #item="{ element }">
          <PortalGroup :groupData="element" />
        </template>
      </draggable>

      <PortalGroupModal
        v-if="showPortalGroupModal"
        mode="create"
        @close="showPortalGroupModal = false"
      />
    </section>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import PortalGroup from './PortalGroup.vue'
import PortalGroupModal from './Modal/PortalGroupModal.vue'
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
  @apply flex;
}

.portal-group-list {
  @apply flex flex-col gap-5 px-4 py-3;
}
</style>
