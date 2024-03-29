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
        <div class="portal-tag-option" @click="openPortalFolder(data)">
          <n-icon><BuildOutline /></n-icon>
          <span>{{ translate('portalPane.portalTag.openFolder') }}</span>
        </div>
        <div class="portal-tag-option" @click="editPortal(groupId, data)">
          <n-icon><BuildOutline /></n-icon>
          <span>{{ translate('common.edit') }}</span>
        </div>
        <div class="portal-tag-option" @click="deletePortal(groupId, data)">
          <n-icon><TrashBinOutline /></n-icon>
          <span>{{ translate('common.delete') }}</span>
        </div>
      </section>
    </n-popover>

    <PortalTagModal
      mode="edit"
      :data="selectPortal"
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
import { onMounted, watch } from '@vue/runtime-core'
import { findIndex, find } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { dataClone } from '/@/utils/data'
import useLocale from '/@/use/locale'
import { useElectron } from '/@/use/electron'

// --- Props ---
const props = defineProps({
  groupId: String,
  data: Object,
})

const { fileSystem } = useElectron()

const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
// --- Data ---
const actived = ref(false)
const showPopOver = ref(false)
const showPortalTagModal = ref(false)
const selectPortal = ref<any>(null)
const styles = reactive({
  borderColor: '',
  background: '',
  color: '',
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
        group: groupId,
      })
  } else {
    styles.borderColor = portal.bg
    styles.background = ''
    styles.color = ''
    if (exist >= 0) portalPaneStore.RemoveActivePortal(exist)
  }
}

// => 刪除protal
const deletePortal = async (groupId: string, portal: Portal) => {
  const portals = dataClone(portalsData.value) as PortalGroup[]
  const group: PortalGroup | undefined = find(portals, { id: groupId })
  if (!group) return
  const index = findIndex(group.childs, { id: portal.id })
  group.childs.splice(index, 1)

  await appStore.SaveToDB({ key: 'portals', data: portals })
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })

  const activePortalsRef = activePortals.value
  const exist = findIndex(activePortalsRef, { id: portal.id })
  if (exist >= 0) await portalPaneStore.RemoveActivePortal(exist)
}

// => 編輯更新protal
const editPortal = async (groupId, portal) => {
  selectPortal.value = { groupId, portal }
  showPortalTagModal.value = true
  showPopOver.value = false
}

const openPortalFolder = async (portal: Portal) => {
  const [res, err] = await fileSystem.openFolder(portal.link)
  console.log(res)
  console.log(err)
}

// => 更新popover顯示狀態
const updatePopOver = (show: boolean) => {
  showPopOver.value = show
}

watch(props, () => {
  const portal: Portal = props.data
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
  const portal: Portal = props.data
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
  @apply hover:(text-dark bg-primary);
}
.portal-tag-option:hover span {
  @apply text-dark;
}
</style>
