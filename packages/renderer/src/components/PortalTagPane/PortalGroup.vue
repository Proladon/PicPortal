<template>
  <div class="portal-group">
    <section class="group-header">
      <div class="flex items-center gap-2">
        <n-icon
          size="20"
          v-if="groupData.childs.length"
          @click="expandGroup"
          :class="{ unexpend: !expand }"
        >
          <CaretDown />
        </n-icon>
        <n-badge :value="groupActivedPortalsCount" />
        <n-ellipsis>
          <span @click="expandGroup">{{ groupData.group }}</span>
        </n-ellipsis>
      </div>

      <div class="controls-icon">
        <n-icon size="20" @click="showPortalTagModal = true"><Add /></n-icon>

        <n-popover
          trigger="click"
          placement="bottom-end"
          :show="showPopOver"
          @update:show="updatePopOver"
        >
          <template #trigger>
            <n-icon size="15">
              <MenuSharp />
            </n-icon>
          </template>
          <div
            @click="openPortalGroupModal"
            class="flex items-center gap-2 cursor-pointer"
          >
            <n-icon>
              <PencilSharp />
            </n-icon>
            <span>Rename</span>
          </div>

          <div
            @click="deleteGroup(groupData.id)"
            class="flex items-center gap-2 cursor-pointer"
          >
            <n-icon>
              <TrashBinOutline />
            </n-icon>
            <span>Delete</span>
          </div>
        </n-popover>
      </div>
    </section>

    <section class="portal-tag-list" v-if="expand">
      <PortalTag
        v-for="portalTag in groupData.childs"
        :key="portalTag"
        :data="portalTag"
        :groupId="groupData.id"
      />
    </section>

    <!-- Modal -->
    <PortalGroupModal
      v-if="showPortalGroupModal"
      :group="groupData"
      mode="edit"
      @close="showPortalGroupModal = false"
    />

    <PortalTagModal
      mode="create"
      :groupId="groupData.id"
      v-if="showPortalTagModal"
      @close="showPortalTagModal = false"
    />
  </div>
</template>

<script setup>
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import { NIcon, NEllipsis, NCheckbox, NPopover, NBadge } from 'naive-ui'
import {
  Add,
  CaretDown,
  MenuSharp,
  TrashBinOutline,
  PencilSharp,
} from '@vicons/ionicons5'
import { computed, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import PortalTag from './PortalTag.vue'
import PortalTagModal from './Modal/PortalTagModal.vue'
import { useStore } from 'vuex'
import { filter, findIndex } from 'lodash-es'
import { dataClone } from '/@/utils/data'

// --- Data ---
const props = defineProps({
  groupData: Object,
})
const store = useStore()
const expand = ref(false)
const showPopOver = ref(false)
const showPortalTagModal = ref(false)
const showPortalGroupModal = ref(false)

// --- Computed ---
const portalsData = computed(() => store.getters.portals)
const activedPortals = computed(() => store.getters.activedPortals)
const groupActivedPortalsCount = computed(() => {
  const groupId = props.groupData.id
  const activeds = store.getters.activedPortals
  return filter(activeds, { group: groupId }).length
})

// --- Methods ---
const openPortalGroupModal = () => {
  showPortalGroupModal.value = true
  showPopOver.value = false
}

const expandGroup = async () => {
  if (!props.groupData.childs.length) return
  expand.value = !expand.value
}

// => 刪除 portalGroup
const deleteGroup = async (groupId) => {
  const protals = dataClone(portalsData.value)
  const grounIndex = findIndex(protals, { id: groupId })
  protals.splice(grounIndex, 1)
  await store.dispatch('SAVE_TO_DB', {
    key: 'portals',
    data: protals,
  })
  await store.dispatch('SYNC_DB_TO_STATE', 'portals')

  const needDelete = filter(
    activedPortals.value,
    (portal) => portal.group === groupId
  )
  // TODO background task
  for (let t = 0; t < needDelete.length; t++) {
    const index = findIndex(activedPortals.value, {
      group: needDelete[t].group,
    })
    await store.dispatch('SPLICE_ACTIVED_PORTALS', index)
  }
}

const updatePopOver = (show) => {
  showPopOver.value = show
}

const renameGroup = () => {
  showPopOver.value = false
}
</script>

<style lang="postcss" scoped>
.portal-group {
  @apply flex flex-col;
}

.group-header {
  @apply flex items-center justify-between cursor-pointer;

  .controls-icon {
    @apply flex flex-shrink-0 items-center gap-3;
  }
}

.portal-tag-list {
  @apply text-left py-2 pl-7;
  @apply flex flex-col gap-3;
}

.unexpend {
  @apply transform rotate-270;
}
</style>
