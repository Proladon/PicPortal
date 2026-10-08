<template>
  <div
    class="portal-tag group/tag relative flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-sm select-none transition-colors"
    :class="
      actived
        ? 'border-transparent bg-primary font-medium text-primary-foreground shadow-sm'
        : 'bg-background/60 hover:bg-accent hover:text-accent-foreground'
    "
    :style="actived ? portalChipStyle(data) : undefined"
    :title="data.link"
    @click="activePortal"
  >
    <span
      v-if="!actived"
      class="size-2 shrink-0 rounded-full ring-1 ring-foreground/10"
      :style="{ background: data.bg || 'var(--muted-foreground)' }"
    />
    <span class="portal-name min-w-0 flex-1 truncate">{{ data.name }}</span>

    <DropdownMenu v-if="!appStore.readOnly">
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="portal-tag-edit absolute top-1/2 right-0.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm bg-inherit opacity-0 transition group-hover/tag:opacity-100 hover:brightness-125 focus-visible:opacity-100 data-open:opacity-100"
          :aria-label="t('portalPane.portalTag.actions')"
          @click.stop
        >
          <EllipsisVertical class="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-40">
        <DropdownMenuItem @select="openPortalFolder(data)">
          <FolderOpen />
          {{ t('portalPane.portalTag.openFolder') }}
        </DropdownMenuItem>
        <DropdownMenuItem @select="editPortal(groupId, data)">
          <Pencil />
          {{ t('common.edit') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          @select="deletePortal(groupId, data)"
        >
          <Trash2 />
          {{ t('common.delete') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

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
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { EllipsisVertical, FolderOpen, Pencil, Trash2 } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '/@/components/ui/dropdown-menu'
import { findIndex, find } from 'lodash-es'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { dataClone } from '/@/utils/data'
import { portalChipStyle } from '/@/utils/color'
import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'

// --- Props ---
const props = defineProps({
  groupId: { type: String, required: true },
  data: { type: Object as PropType<Portal>, required: true },
})

const { fileSystem } = useDesktop()

const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
// --- Data ---
const showPortalTagModal = ref(false)
const selectPortal = ref<any>(null)

// --- Computed ---
const portalsData = computed(() => portalPaneStore.portals)
const activePortals = computed(() => portalPaneStore.activePortals)
const actived = computed(() =>
  activePortals.value.some((portal) => portal.id === props.data.id)
)

// --- Methods ---
// => 啟用protalTag
const activePortal = async () => {
  const portal: Portal = props.data
  const groupId = props.groupId
  if (!groupId) return
  const exist = findIndex(activePortals.value, { id: portal.id })
  if (exist >= 0) portalPaneStore.RemoveActivePortal(exist)
  else
    portalPaneStore.AddActivedPortal({
      id: portal.id,
      group: groupId,
    })
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
const editPortal = async (groupId: string, portal: Portal) => {
  selectPortal.value = { groupId, portal }
  showPortalTagModal.value = true
}

const openPortalFolder = async (portal: Portal) => {
  const [, err] = await fileSystem.openFolder(portal.link)
  if (err) reportDesktopError(err)
}
</script>
