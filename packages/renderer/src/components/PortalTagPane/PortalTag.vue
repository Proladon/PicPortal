<template>
  <div
    class="portal-tag"
    @click="activePortal"
    :class="{ 'portal-tag--actived': actived }"
    :style="`border-color: ${data.color}; color: ${data.color}`"
  >
    <span>{{ data.name }}</span>
    <n-popover
      :show="showPopOver"
      trigger="click"
      placement="bottom-end"
      @update:show="updatePopOver"
    >
      <template #trigger>
        <n-icon><PencilSharp /></n-icon>
      </template>
      <div class="portal-tag-option" @click="editPortalTag(groupId, data)">
        <n-icon><BuildOutline /></n-icon>
        <span>Edit</span>
      </div>
      <div class="portal-tag-option" @click="deletePortalTag(groupId, data)">
        <n-icon><TrashBinOutline /></n-icon>
        <span>Delete</span>
      </div>
    </n-popover>

    <PortalTagModal
      mode="edit"
      :portal="selectPortal"
      v-if="showPortalTagModal"
      @close="showPortalTagModal = false"
    />
  </div>
</template>

<script setup>
import PortalTagModal from './Modal/PortalTagModal.vue'
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
const showPopOver = ref(false)
const showPortalTagModal = ref(false)
const selectPortal = ref(false)
const portalsData = computed(() => store.getters.portals)

const activePortal = (e) => {
  if (!e.target.classList.length) return
  actived.value = !actived.value
}

const deletePortalTag = async (groupId, portal) => {
  const portals = cloneDeep(portalsData.value)
  const group = find(portals, { id: groupId })
  const index = findIndex(group.childs, { id: portal.id })
  group.childs.splice(index, 1)

  await store.dispatch('SAVE_TO_DB', {
    key: 'portals',
    data: portals,
  })
  await store.dispatch('SYNC_DB_TO_STATE', 'portals')
}

const editPortalTag = async (groupId, portal) => {
  selectPortal.value = { groupId, portal }
  showPortalTagModal.value = true
  showPopOver.value = false
}

const updatePopOver = (show) => {
  showPopOver.value = show
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

.portal-tag-option {
  @apply flex items-center gap-2 cursor-pointer;
}
</style>
