<template>
  <div class="tree-view">
    <div
      class="bg-border flex justify-between items-center px-5"
      title="Add Group"
    >
      <span class="text-gray-800">Labels</span>
      <addGroupModal :lables="lables" />
    </div>
    <section class="flex-1 flex flex-col gap-2 py-5 px-5" v-if="lables.length">
      <p class="lable-group" v-for="t in lables" :key="t">{{ t.group }}</p>
    </section>
  </div>
</template>

<script setup>
import addGroupModal from '/@/components/TreeView/addGroupModal.vue'
import { useStore } from 'vuex'
import { computed } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
const store = useStore()
const lables = computed(() => store.getters.lables)

onMounted(async () => {
  const [getRes, getError] = await store.dispatch('DB_GET', 'lables')
  if (getError) alert(getError)

  await store.dispatch('SYNC_DB_STATE', { key: 'lables', dbData: getRes })
})
</script>

<style lang="postcss" scoped>
.tree-view {
  @apply flex flex-col;
}

.lable-group {
  @apply bg-border text-gray-800;
}
</style>
