<template>
  <div
    class="portal-tag"
    @click="activePortal"
    :style="styles"
    :title="data.link"
  >
    <n-ellipsis>
      <span>{{ data.name }}</span>
    </n-ellipsis>
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
import { NIcon, NPopover, NButton, NEllipsis } from 'naive-ui'
import { PencilSharp, TrashBinOutline, BuildOutline } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { onBeforeUpdate, onMounted } from '@vue/runtime-core'
import { findIndex, find, cloneDeep } from 'lodash-es'
// --- Props ---
const props = defineProps({
  groupId: String,
  data: Object,
})

// --- Data ---
const store = useStore()
const actived = ref(false)
const showPopOver = ref(false)
const showPortalTagModal = ref(false)
const selectPortal = ref(false)
const styles = reactive({
  borderColor: '',
  background: '',
  color: '',
})

// --- Computed ---
const portalsData = computed(() => store.getters.portals)
const activedPortals = computed(() => store.getters.activedPortals)

// --- Methods ---
// => 啟用protalTag
const activePortal = async (e) => {
  if (!e.target.classList.length) return
  actived.value = !actived.value

  const portal = props.data
  const groupId = props.groupId
  const activedPortalsRef = activedPortals.value
  const exist = findIndex(activedPortalsRef, { id: portal.id })

  if (actived.value) {
    styles.background = portal.bg
    styles.color = portal.fg
    if (exist < 0)
      await store.dispatch('PUSH_ACTIVED_PORTALS', {
        id: portal.id,
        group: groupId,
      })
  } else {
    styles.background = ''
    styles.color = ''
    if (exist >= 0) await store.dispatch('SPLICE_ACTIVED_PORTALS', exist)
  }
}

// => 刪除protalTag
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

  const activedPortalsRef = activedPortals.value
  const exist = findIndex(activedPortalsRef, { id: portal.id })
  if (exist >= 0) await store.dispatch('SPLICE_ACTIVED_PORTALS', exist)
}

// => 編輯更新protalTag
const editPortalTag = async (groupId, portal) => {
  selectPortal.value = { groupId, portal }
  showPortalTagModal.value = true
  showPopOver.value = false
}

// => 更新popover顯示狀態
const updatePopOver = (show) => {
  showPopOver.value = show
}
// --- Mounted ---
onMounted(() => {
  const portal = props.data
  styles.borderColor = portal.bg

  const activedPortalsRef = activedPortals.value
  const exist = findIndex(activedPortalsRef, { id: portal.id })
  if (exist >= 0) {
    actived.value = true
    styles.borderColor = portal.bg
    styles.background = portal.bg
    styles.color = portal.fg
  }
})
</script>

<style lang="postcss" scoped>
.portal-tag {
  @apply px-2 py-1 rounded-md cursor-pointer;
  @apply border-solid border-[1px] font-medium;
  @apply flex justify-between items-center;
}

.portal-tag-option {
  @apply flex items-center gap-2 cursor-pointer;
}
</style>
