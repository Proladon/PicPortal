<template>
  <div class="flex shrink-0 flex-col gap-2 px-3 pt-3 pb-2.5">
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <Waypoints class="size-4 shrink-0 text-primary" />
        <span class="truncate">{{ t('portalPane.title') }}</span>
        <Badge variant="secondary" class="h-4 px-1.5 text-[10px] tabular-nums">
          {{ portalPaneStore.flattenPortals.length }}
        </Badge>
      </div>
      <div class="controls-container flex shrink-0 items-center">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              class="new-group-btn"
              variant="ghost"
              size="icon-sm"
              :disabled="readOnly"
              :aria-label="t('portalPane.controls.newGroup')"
              @click="showPortalGroupModal = true"
            >
              <FolderPlus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{
            t('portalPane.controls.newGroup')
          }}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              class="panel-side-btn"
              variant="ghost"
              size="icon-sm"
              :aria-label="sideLabel"
              @click="changePortalPanelPosition"
            >
              <PanelLeft v-if="portalPanelPosition === 'right'" />
              <PanelRight v-else />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ sideLabel }}</TooltipContent>
        </Tooltip>
      </div>
    </div>

    <InputGroup class="h-8">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        v-model="searchPortalName"
        class="portal-search"
        :placeholder="t('portalPane.search.placeholder')"
      />
      <InputGroupAddon v-if="searchPortalName" align="inline-end">
        <InputGroupButton
          size="icon-xs"
          :aria-label="t('common.clear')"
          @click="resetSearch"
        >
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </div>

  <PortalGroupModal
    v-if="showPortalGroupModal"
    mode="create"
    @close="showPortalGroupModal = false"
  />
</template>

<script setup lang="ts">
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FolderPlus,
  PanelLeft,
  PanelRight,
  Search,
  Waypoints,
  X,
} from '@lucide/vue'
import { Badge } from '/@/components/ui/badge'
import { Button } from '/@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '/@/components/ui/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useAppStore } from '/@/store/appStore'
const readOnly = computed(() => useAppStore().readOnly)

// ANCHOR Use
const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
// ANCHOR Data
const showPortalGroupModal = ref<boolean>(false)
// ANCHOR Computed
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
const sideLabel = computed(() =>
  portalPanelPosition.value === 'right'
    ? t('portalPane.controls.moveLeft')
    : t('portalPane.controls.moveRight')
)
const searchPortalName = computed({
  get: () => portalPaneStore.searchPortalName,
  set: (value: string | number) => {
    portalPaneStore.searchPortalName = String(value ?? '').trim()
  },
})
// ANCHOR Methods
const changePortalPanelPosition = () => {
  if (portalPanelPosition.value === 'right')
    viewerStore.SET_PORTAL_PANEL_POSITION('left')
  else if (portalPanelPosition.value === 'left')
    viewerStore.SET_PORTAL_PANEL_POSITION('right')
}

const resetSearch = () => {
  portalPaneStore.searchPortalName = ''
}
</script>
