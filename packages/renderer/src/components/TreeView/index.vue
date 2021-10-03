<template>
  <div class="tree-view">
    <div
      class="bg-border flex justify-between items-center px-5 py-1"
      title="Add Group"
    >
      <div class="text-gray-800 text-[16px] flex items-center">
        <n-icon><Pricetags /></n-icon>
        Labels Panel
      </div>
      <AddGroupModal />
    </div>

    <draggable
      class="px-2 py-2"
      v-model="labels"
      group="people"
      @start="drag = true"
      @end="drag = false"
      item-key="id"
    >
      <template #item="{ element }">
        <div class="flex flex-col">
          <div
            class="
              text-[16px]
              rounded-sm
              px-2
              py-2
              text-left
              flex
              justify-between
              items-center
              cursor-pointer
              text-border
              hover:bg-gray-700
            "
          >
            <n-ellipsis>
              {{ element.group }}
            </n-ellipsis>

            <div class="flex-shrink-0">
              <n-icon class="mr-2">
                <Add />
              </n-icon>

              <n-icon>
                <CaretBackOutline />
              </n-icon>
            </div>
          </div>
          <div class="text-left pl-5" v-for="test in labels" :key="test">
            <n-checkbox>{{ test.group }}</n-checkbox>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import AddGroupModal from '/@/components/TreeView/Modal/AddGroupModal.vue'
import { CaretDown, CaretBackOutline, Pricetags, Add } from '@vicons/ionicons5'
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import { useStore } from 'vuex'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
const store = useStore()
const drag = ref(false)
const labels = computed({
  get: () => store.getters.labels,
  set: async (newData) => {
    const [, error] = await store.dispatch('SAVE_TO_DB', {
      key: 'labels',
      data: JSON.stringify(newData),
    })
    await store.dispatch('SYNC_DB_TO_STATE', 'labels')
    if (error) alert(error)
  },
})

onMounted(async () => {
  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
})
</script>

<style lang="postcss" scoped>
.tree-view {
  @apply flex flex-col min-w-[180px];
}

.lable-group {
  @apply text-border cursor-move;
}
</style>
