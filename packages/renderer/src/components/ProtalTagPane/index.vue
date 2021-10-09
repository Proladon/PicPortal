<template>
  <div class="tree-view">
    <div class="bg-border flex justify-between items-center px-5 py-1">
      <div class="text-gray-800 text-[16px] flex items-center">
        <n-icon><Pricetags /></n-icon>
        Labels Panel
      </div>
      <ProtalGroupModal />
      <n-icon><EnterSharp /></n-icon>
    </div>
    <draggable
      class="labels-group-list"
      v-model="labels"
      group="people"
      @start="drag = true"
      @end="drag = false"
      item-key="id"
    >
      <template #item="{ element }">
        <ProtalGroup :groupData="element" />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import ProtalGroup from './ProtalGroup.vue'
import ProtalGroupModal from './Modal/ProtalGroupModal.vue'
import { Pricetags, EnterSharp } from '@vicons/ionicons5'
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'

// --- Data ---
const store = useStore()
const drag = ref(false)

// --- Computed ---
const labels = computed({
  get: () => store.getters.labels,
  set: async (newData) => {
    const [, error] = await store.dispatch('SAVE_TO_DB', {
      key: 'labels',
      data: newData,
    })
    await store.dispatch('SYNC_DB_TO_STATE', 'labels')
    if (error) alert(error)
  },
})

// --- Mounted ---
onMounted(async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
})
</script>

<style lang="postcss" scoped>
.tree-view {
  @apply flex flex-col min-w-[180px];
}

.labels-group-list {
  @apply flex flex-col gap-5 px-4 py-3;
}
</style>
