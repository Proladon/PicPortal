<template>
  <div
    class="controls-block flex shrink-0 flex-wrap items-center justify-between gap-2 border-y bg-background/40 px-3 py-2"
  >
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      :model-value="portalPaneStore.dockingMode"
      :aria-label="t('portalPane.mode.label')"
      @update:model-value="changeDockingMode"
    >
      <ToggleGroupItem value="append" class="gap-1 px-2 text-xs">
        <Layers />
        {{ t('portalPane.mode.append') }}
      </ToggleGroupItem>
      <ToggleGroupItem value="override" class="gap-1 px-2 text-xs">
        <Replace />
        {{ t('portalPane.mode.override') }}
      </ToggleGroupItem>
    </ToggleGroup>
    <div class="activated-count flex items-center gap-1">
      <Badge
        :variant="activatedPortalsCount ? 'default' : 'secondary'"
        class="tabular-nums"
      >
        {{ t('portalPane.controls.active', { count: activatedPortalsCount }) }}
      </Badge>
      <Button
        size="xs"
        variant="ghost"
        :disabled="!activatedPortalsCount"
        @click="resetAvtivatedPortals"
      >
        {{ t('portalPane.controls.clear') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Layers, Replace } from '@lucide/vue'
import { Badge } from '/@/components/ui/badge'
import { Button } from '/@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '/@/components/ui/toggle-group'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

// ANCHOR Use
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
// ANCHOR Computed
const activatedPortalsCount = computed(
  () => portalPaneStore.activePortals.length
)
// ANCHOR Methods
const resetAvtivatedPortals = async () => {
  portalPaneStore.ResetActivePortal()
}

const changeDockingMode = (mode: unknown) => {
  if (mode !== 'append' && mode !== 'override') return
  portalPaneStore.SetDockingMode(mode)
  toast.success(
    `${t('portalPane.notify.modeChange')}: ${t(`portalPane.mode.${mode}`)}`,
    { duration: 2000 }
  )
}
</script>
