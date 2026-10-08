<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" class="view-mode-switcher gap-1.5">
        <component :is="current.icon" />
        <span>{{ t(`viewer.modes.${current.type}`) }}</span>
        <ChevronDown class="opacity-50" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-48">
      <DropdownMenuLabel>{{ t('viewer.modes.label') }}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        :model-value="current.type"
        @update:model-value="changeView"
      >
        <DropdownMenuRadioItem
          v-for="mode in modes"
          :key="mode.type"
          :value="mode.type"
        >
          <component :is="mode.icon" />
          {{ t(`viewer.modes.${mode.type}`) }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ChevronDown,
  Focus,
  Grid3x3,
  LayoutGrid,
  List,
  Rows3,
} from '@lucide/vue'
import { Button } from '/@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '/@/components/ui/dropdown-menu'
import type { ViewerTypes } from '/@/store/viewerStore'
import { useViewerStore } from '/@/store/viewerStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const viewerStore = useViewerStore()

const modes: { type: ViewerTypes; icon: unknown }[] = [
  { type: 'GridView', icon: LayoutGrid },
  { type: 'ListView', icon: List },
  { type: 'VirtualGrid', icon: Grid3x3 },
  { type: 'VirtualList', icon: Rows3 },
  { type: 'FocusView', icon: Focus },
]

const current = computed(
  () => modes.find((mode) => mode.type === route.name) || modes[0]
)

const changeView = (type: unknown): void => {
  const mode = modes.find((item) => item.type === type)
  if (!mode) return
  viewerStore.SET_LAST_VIEWER_TYPE(mode.type)
  router.push({ name: mode.type })
}
</script>
