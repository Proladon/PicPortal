<template>
  <div class="portal-group" v-if="showPortalGroup">
    <section class="group-header">
      <div class="flex flex-1 items-center gap-2" @click="expandGroup">
        <n-badge color="#91B4C0" dot v-if="groupActivedPortalsCount" />
        <n-ellipsis>
          <span class="font-bold">{{ groupData.group }}</span>
        </n-ellipsis>
      </div>

      <div class="controls-icon">
        <n-button text>
          <n-icon size="20" @click="showPortalTagModal = true"><Add /></n-icon>
        </n-button>

        <n-popover
          raw
          trigger="click"
          placement="bottom-end"
          :show="showPopOver"
          @update:show="updatePopOver"
        >
          <template #trigger>
            <n-button text>
              <n-icon size="15">
                <MenuSharp />
              </n-icon>
            </n-button>
          </template>

          <!-- PopOver Content -->
          <section class="py-2">
            <div
              class="portal-group-popover-item"
              @click=";(listView = 'list'), (showPopOver = false)"
            >
              <n-icon>
                <ListSharp />
              </n-icon>
              <span>{{ translate('portalPane.portalGroup.view.list') }}</span>
            </div>
            <div
              class="portal-group-popover-item"
              @click=";(listView = 'grid'), (showPopOver = false)"
            >
              <n-icon>
                <Grid />
              </n-icon>
              <span>{{ translate('portalPane.portalGroup.view.grid') }}</span>
            </div>
            <n-divider class="!my-2" />
            <div
              class="portal-group-popover-item"
              @click="randomGroupPortalColor(groupData.id)"
            >
              <n-icon>
                <ColorFill />
              </n-icon>
              <span>{{ translate('portalPane.portalGroup.randomColor') }}</span>
            </div>
            <div class="portal-group-popover-item">
              <n-icon>
                <ColorFill />
              </n-icon>
              <span>{{ translate('portalPane.portalGroup.syncColor') }}</span>
            </div>

            <div
              @click="openPortalGroupModal"
              class="portal-group-popover-item"
            >
              <n-icon>
                <PencilSharp />
              </n-icon>
              <span>{{ translate('portalPane.portalGroup.rename') }}</span>
            </div>

            <div
              @click="deleteGroup(groupData.id)"
              class="portal-group-popover-item"
            >
              <n-icon>
                <TrashBinOutline />
              </n-icon>
              <span>{{ translate('common.delete') }}</span>
            </div>
          </section>
        </n-popover>

        <n-button text :type="expand ? 'primary' : ''">
          <n-icon
            size="20"
            v-if="groupData.childs.length"
            @click="expandGroup"
            :class="{ unexpend: !expand }"
          >
            <CaretDown />
          </n-icon>
        </n-button>
      </div>
    </section>

    <draggable
      v-model="groupPortals"
      group="portal"
      item-key="id"
      :animation="300"
      :class="{
        'list-view': listView === 'list',
        'grid-view': listView === 'grid',
      }"
    >
      <template #item="{ element }">
        <div v-if="expand">
          <PortalTag
            :key="element.id"
            :data="element"
            :groupId="groupData.id"
          />
        </div>
      </template>
    </draggable>

    <!-- Modal -->
    <PortalGroupModal
      v-if="showPortalGroupModal"
      :group="groupData"
      mode="edit"
      @close="showPortalGroupModal = false"
    />

    <PortalTagModal
      mode="create"
      :data="{ groupId: groupData.id }"
      v-if="showPortalTagModal"
      @close="showPortalTagModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import { NButton, NIcon, NEllipsis, NPopover, NBadge, NDivider } from 'naive-ui'
import {
  Add,
  CaretDown,
  MenuSharp,
  TrashBinOutline,
  PencilSharp,
  ColorFill,
  ListSharp,
  Grid,
} from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import PortalTag from './PortalTag.vue'
import PortalTagModal from './Modal/PortalTagModal.vue'
import { filter, findIndex, find, random } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'
// --- Data ---
const props = defineProps({
  groupData: Object,
})
const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
const listView = ref('list')
const expand = ref(false)
const showPopOver = ref(false)
const showPortalTagModal = ref(false)
const showPortalGroupModal = ref(false)

// --- Computed ---
const portalsData = computed(() => portalPaneStore.portals)
const activePortals = computed(() => portalPaneStore.activePortals)
const searchPortalName = computed(() => portalPaneStore.searchPortalName)
const groupActivedPortalsCount = computed(() => {
  const groupId = props.groupData.id
  const activeds = activePortals.value
  return filter(activeds, { group: groupId }).length
})

const groupPortals = computed({
  get: () => {
    const search = searchPortalName.value
    if (search)
      return filter(props.groupData.childs, (portal: Portal) =>
        portal.name.includes(search)
      )
    return props.groupData.childs
  },
  set: async (newData) => {
    const portalsRef = portalsData.value
    const groupIndex = findIndex(portalsRef, { id: props.groupData.id })

    await appStore.DeepSaveToDB({
      key: `[portals][${groupIndex}][childs]`,
      data: newData,
    })
    await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
  },
})
const showPortalGroup = computed(() => {
  if (searchPortalName.value && !groupPortals.value.length) return false
  return true
})

// --- Methods ---

const openPortalGroupModal = () => {
  showPortalGroupModal.value = true
  showPopOver.value = false
}

const expandGroup = async () => {
  // if (!props.groupData.childs.length) return
  expand.value = !expand.value
}

// => 刪除 portalGroup
const deleteGroup = async (groupId: any) => {
  const protals: PortalGroup[] = dataClone(portalsData.value)
  const grounIndex = findIndex(protals, { id: groupId })
  protals.splice(grounIndex, 1)
  await appStore.SaveToDB({ key: 'portals', data: protals })
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })

  const needDelete = filter(
    activePortals.value,
    (portal) => portal.group === groupId
  )
  // TODO background task
  for (let t = 0; t < needDelete.length; t++) {
    const index = findIndex(activePortals.value, {
      group: needDelete[t].group,
    })
    portalPaneStore.RemoveActivePortal(index)
  }
}

const updatePopOver = (show: boolean) => {
  showPopOver.value = show
}

const randomGroupPortalColor = async (groupId: string) => {
  const protals: PortalGroup[] = dataClone(portalsData.value)
  const groupIndex = findIndex(protals, { id: groupId })
  if (groupIndex < 0) return
  protals[groupIndex].childs.forEach((portal: Portal) => {
    portal.bg = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`
    portal.fg = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`
  })
  await appStore.SaveToDB({ key: 'portals', data: protals })
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
  updatePopOver(false)
}
</script>

<style lang="postcss" scoped>
.portal-group {
  @apply flex flex-col text-base;
  @apply border border-1 border-transparent;
}

.group-header {
  @apply flex items-center justify-between cursor-pointer;

  .controls-icon {
    @apply flex flex-shrink-0 items-center gap-1;
  }
}

.list-view {
  @apply text-left py-2 pl-7;
  @apply flex flex-col gap-3;
}

.grid-view {
  @apply grid grid-cols-2 gap-3 pl-7 py-2;
}

.unexpend {
  @apply transform rotate-270;
}

.portal-group-popover-item {
  @apply flex items-center gap-2 cursor-pointer px-3;
  @apply hover:(text-dark bg-primary);
}
.portal-group-popover-item:hover span {
  @apply text-dark;
}
</style>
