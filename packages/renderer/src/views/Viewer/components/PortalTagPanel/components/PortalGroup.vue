<template>
  <div class="portal-group flex flex-col" v-if="showPortalGroup">
    <section
      class="group-header group/header flex h-8 cursor-pointer items-center gap-0.5 rounded-md pr-1 transition-colors hover:bg-accent/70"
    >
      <button
        type="button"
        class="group-toggle flex h-full min-w-0 flex-1 items-center gap-1.5 pl-1 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
        :aria-expanded="isExpanded"
        @click="expandGroup"
      >
        <ChevronRight
          class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
        />
        <span class="truncate">{{ groupData.group }}</span>
        <span
          class="shrink-0 text-xs font-normal text-muted-foreground tabular-nums"
        >
          {{ groupData.childs.length }}
        </span>
        <span
          v-if="groupActivedPortalsCount"
          class="ml-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
        >
          {{ groupActivedPortalsCount }}
        </span>
      </button>

      <div
        v-if="!appStore.readOnly"
        class="controls-icon flex shrink-0 items-center"
      >
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              class="add-portal-btn text-muted-foreground"
              variant="ghost"
              size="icon-xs"
              :aria-label="t('portalPane.portalGroup.addPortal')"
              @click.stop="showPortalTagModal = true"
            >
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{
            t('portalPane.portalGroup.addPortal')
          }}</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              class="text-muted-foreground"
              variant="ghost"
              size="icon-xs"
              :aria-label="t('portalPane.portalGroup.actions')"
              @click.stop
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <DropdownMenuLabel>{{
              t('portalPane.portalGroup.view.label')
            }}</DropdownMenuLabel>
            <DropdownMenuRadioGroup v-model="listView">
              <DropdownMenuRadioItem value="list">
                <List />
                {{ t('portalPane.portalGroup.view.list') }}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="grid">
                <LayoutGrid />
                {{ t('portalPane.portalGroup.view.grid') }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="randomGroupPortalColor(groupData.id)">
              <Shuffle />
              {{ t('portalPane.portalGroup.randomColor') }}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Paintbrush />
              {{ t('portalPane.portalGroup.syncColor') }}
            </DropdownMenuItem>
            <DropdownMenuItem @select="openPortalGroupModal">
              <Pencil />
              {{ t('portalPane.portalGroup.rename') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              @select="showDeleteConfirm = true"
            >
              <Trash2 />
              {{ t('common.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>

    <draggable
      v-model="groupPortals"
      group="portal"
      item-key="id"
      :animation="300"
      :force-fallback="true"
      :fallback-on-body="true"
      :support-pointer="false"
      handle=".portal-name"
      :disabled="appStore.readOnly"
      :class="[
        isExpanded ? 'pt-1 pb-2' : 'py-0.5',
        {
          'list-view flex flex-col gap-1 pl-6': listView === 'list',
          'grid-view grid grid-cols-2 gap-1 pl-6': listView === 'grid',
        },
      ]"
    >
      <template #item="{ element }">
        <div v-if="isExpanded" class="min-w-0">
          <PortalTag
            :key="element.id"
            :data="element"
            :groupId="groupData.id"
          />
        </div>
      </template>
    </draggable>
    <p
      v-if="isExpanded && !groupData.childs.length"
      class="pb-2 pl-7 text-xs text-muted-foreground"
    >
      {{ t('portalPane.empty.group') }}
    </p>

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

    <ConfirmDialog
      v-if="showDeleteConfirm"
      :title="t('portalPane.portalGroup.deleteTitle')"
      :content="
        t('portalPane.portalGroup.deleteContent', { name: groupData.group })
      "
      :confirm-text="t('common.delete')"
      @close="showDeleteConfirm = false"
      @confirm="deleteGroup(groupData.id)"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import draggable from 'vuedraggable'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronRight,
  Ellipsis,
  LayoutGrid,
  List,
  Paintbrush,
  Pencil,
  Plus,
  Shuffle,
  Trash2,
} from '@lucide/vue'
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import PortalTag from './PortalTag.vue'
import PortalTagModal from './Modal/PortalTagModal.vue'
import ConfirmDialog from '/@/components/ConfirmDialog.vue'
import { Button } from '/@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '/@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { filter, findIndex, random } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
// --- Data ---
const props = defineProps({
  groupData: { type: Object as PropType<PortalGroup>, required: true },
})
const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
const listView = ref('grid')
const expand = ref(false)
const showPortalTagModal = ref(false)
const showPortalGroupModal = ref(false)
const showDeleteConfirm = ref(false)

// --- Computed ---
const portalsData = computed(() => portalPaneStore.portals)
const activePortals = computed(() => portalPaneStore.activePortals)
const searchPortalName = computed(() => portalPaneStore.searchPortalName)
const isExpanded = computed(
  () => expand.value || Boolean(searchPortalName.value)
)
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
}

const expandGroup = async () => {
  expand.value = !isExpanded.value
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
}
</script>
