<template>
  <div
    class="portal-tag"
    @click="activePortal"
    :class="{ 'portal-tag--actived': actived }"
    :style="`border-color: ${data.color}; color: ${data.color}`"
  >
    <span>{{ data.name }}</span>
    <n-popover trigger="click" placement="bottom-end">
      <template #trigger>
        <n-icon><PencilSharp /></n-icon>
      </template>
      <div class="protal-tag-option" @click="editProtalTag(groupId, data)">
        <n-icon><BuildOutline /></n-icon> Edit
      </div>
      <div class="protal-tag-option" @click="deleteProtalTag(groupId, data)">
        <n-icon><TrashBinOutline /></n-icon> Delete
      </div>
    </n-popover>
  </div>
</template>

<script setup>
import { NIcon, NPopover, NButton } from 'naive-ui'
import { PencilSharp, TrashBinOutline, BuildOutline } from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { findIndex, find, cloneDeep } from 'lodash-es'

defineProps({
  groupId: String,
  data: Object,
})

const actived = ref(false)
const store = useStore()
const protalsData = computed(() => store.getters.labels)

const activePortal = (e) => {
  if (!e.target.classList.length) return
  actived.value = !actived.value
}

const deleteProtalTag = async (groupId, protal) => {
  const protals = cloneDeep(protalsData.value)
  const group = find(protals, { id: groupId })
  console.log('group', group.childs)
  const index = findIndex(group.childs, { id: protal.id })
  group.childs.splice(index, 1)

  await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: protals,
  })
  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
}

const editProtalTag = async (groupId, protal) => {}
</script>

<style lang="postcss" scoped>
.portal-tag {
  @apply text-teal-400 px-2 py-1 rounded-md cursor-pointer;
  @apply border-solid border-[1px] border-teal-400;
  @apply flex justify-between items-center;
}

.portal-tag--actived {
  @apply bg-gray-400;
}

.protal-tag-option {
  @apply flex items-center gap-2 cursor-pointer;
}
</style>
