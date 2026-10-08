<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <NumberField
        class="per-page-control w-24"
        :min="10"
        :max="100"
        :step="5"
        :model-value="viewerStore.gridView.perPage"
        :aria-label="t('viewer.toolbar.perPage')"
        @update:model-value="onChange"
      >
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput class="h-7 text-xs tabular-nums" />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </TooltipTrigger>
    <TooltipContent>{{ t('viewer.toolbar.perPage') }}</TooltipContent>
  </Tooltip>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '/@/components/ui/number-field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { useViewerStore } from '/@/store/viewerStore'

const { t } = useI18n()
const viewerStore = useViewerStore()

const onChange = (val: number | null | undefined) => {
  const next = val || 10
  if (next === viewerStore.gridView.perPage) return
  viewerStore.gridView.perPage = next
  viewerStore.signal.refresh = true
}
</script>
