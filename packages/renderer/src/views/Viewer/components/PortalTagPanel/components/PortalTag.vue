<template>
  <div
    class="portal-tag"
    @click="activePortal"
    :style="styles"
    :title="data.link"
  >
    <n-ellipsis>
      <span class="portal-name">{{ data.name }}</span>
    </n-ellipsis>
    <n-popover
      raw
      :show="showPopOver"
      trigger="click"
      placement="bottom-end"
      @update:show="updatePopOver"
    >
      <template #trigger>
        <n-button text class="portal-tag-edit" @click.stop>
          <n-icon class="portal-tag-edit"><PencilSharp /></n-icon>
        </n-button>
      </template>
      <section class="py-2">
        <div class="portal-tag-option" @click="editPortalTag(groupId, data)">
          <n-icon><BuildOutline /></n-icon>
          <span>Edit</span>
        </div>
        <div class="portal-tag-option" @click="deletePortalTag(groupId, data)">
          <n-icon><TrashBinOutline /></n-icon>
          <span>Delete</span>
        </div>
      </section>
    </n-popover>

    <PortalTagModal
      mode="edit"
      :portal="selectPortal"
      v-if="showPortalTagModal"
      @close="showPortalTagModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import PortalTagModal from './Modal/PortalTagModal.vue'
import { NIcon, NPopover, NButton, NEllipsis } from 'naive-ui'
import { PencilSharp, TrashBinOutline, BuildOutline } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { onMounted, watch } from '@vue/runtime-core'
import { findIndex, find } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { dataClone } from '/@/utils/data'
// --- Props ---
const props = defineProps({
  groupId: String,
  data: Object
})

const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const store = useStore()
// --- Data ---
const actived = ref(false)
const showPopOver = ref(false)
const showPortalTagModal = ref(false)
const selectPortal = ref<any>(null)
const styles = reactive({
  borderColor: '',
  background: '',
  color: ''
})

// --- Computed ---
const portalsData = computed(() => portalPaneStore.portals)
const activePortals = computed(() => portalPaneStore.activePortals)

// --- Methods ---
// => 啟用protalTag
const activePortal = async () => {
  actived.value = !actived.value

  const portal: Portal = props.data
  const groupId = props.groupId
  const activePortalsRef = activePortals.value
  const exist = findIndex(activePortalsRef, { id: portal.id })
  if (!groupId) return
  if (actived.value) {
    styles.borderColor = portal.bg
    styles.background = portal.bg
    styles.color = portal.fg
    if (exist < 0)
      portalPaneStore.AddActivedPortal({
        id: portal.id,
        group: groupId
      })
  } else {
    styles.borderColor = portal.bg
    styles.background = ''
    styles.color = ''
    if (exist >= 0) portalPaneStore.RemoveActivePortal(exist)
  }
}

// => 刪除protalTag
const deletePortalTag = async (groupId: string, portal: Portal) => {
  const portals = dataClone(portalsData.value) as PortalGroup[]
  const group: PortalGroup | undefined = find(portals, { id: groupId })
  if (!group) return
  const index = findIndex(group.childs, { id: portal.id })
  group.childs.splice(index, 1)

  await appStore.SaveToDB({ key: 'portals', data: portals })
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })

  const activePortalsRef = activePortals.value
  const exist = findIndex(activePortalsRef, { id: portal.id })
  if (exist >= 0) await store.dispatch('SPLICE_ACTIVED_PORTALS', exist)
}

// => 編輯更新protalTag
const editPortalTag = async (groupId, portal) => {
  selectPortal.value = { groupId, portal }
  showPortalTagModal.value = true
  showPopOver.value = false
}

// => 更新popover顯示狀態
const updatePopOver = (show: boolean) => {
  showPopOver.value = show
}

watch(props, () => {
  const portal = props.data
  styles.borderColor = portal.bg

  const activePortalsRef = activePortals.value
  const exist = findIndex(activePortalsRef, { id: portal.id })
  if (exist >= 0) {
    actived.value = true
    styles.borderColor = portal.bg
    styles.background = portal.bg
    styles.color = portal.fg
  }
})

watch(activePortals, () => {
  if (activePortals.value.length) return
  const portal = props.data
  actived.value = false
  styles.borderColor = portal.bg
  styles.background = ''
  styles.color = ''
})

// --- Mounted ---
onMounted(() => {
  const portal = props.data
  styles.borderColor = portal.bg

  const activePortalsRef = activePortals.value
  const exist = findIndex(activePortalsRef, { id: portal.id })
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
  transition: 0.4s;
}

.portal-tag-option {
  @apply flex items-center gap-2 cursor-pointer px-3;
  @apply hover:bg-[var(--border-1)] hover:text-[var(--primary-bg-1)];
}
</style>
