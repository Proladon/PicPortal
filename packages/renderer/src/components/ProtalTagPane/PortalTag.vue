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
      <div class="protal-tag-option" @click="deleteProtalTag(groupId, data)">
        <n-icon><TrashBinOutline /></n-icon> Delete
      </div>
    </n-popover>
  </div>
</template>

<script setup>
import { NIcon, NPopover, NButton } from 'naive-ui'
import { PencilSharp, TrashBinOutline, TrashBinSharp } from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { findIndex, find } from 'lodash-es'

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
  const protals = protalsData.value
  const group = find(protals, { id: groupId })
  console.log('group', group.childs)
  const index = findIndex(group.childs, { id: protal.id })
  group.childs.splice(index, 1)
  console.log(protals)
  await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: JSON.stringify(protals),
  })
}
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
