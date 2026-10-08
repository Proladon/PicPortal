<template>
  <span
    class="tag inline-flex h-5 max-w-full min-w-0 items-center gap-0.5 rounded-md border px-1.5 text-[11px] leading-none font-medium shadow-xs"
    :class="
      portal.bg ? '' : 'border-border bg-secondary text-secondary-foreground'
    "
    :style="portalChipStyle(portal)"
    :title="portal.name"
  >
    <span class="truncate">{{ portal.name }}</span>
    <button
      v-if="closable"
      type="button"
      class="tag-close -mr-1 inline-flex size-4 shrink-0 items-center justify-center rounded-sm opacity-70 transition hover:bg-black/15 hover:opacity-100"
      :aria-label="t('viewer.item.removePortal', { name: portal.name })"
      @click.stop="$emit('close')"
    >
      <X class="size-3" />
    </button>
  </span>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from '@lucide/vue'
import { portalChipStyle } from '/@/utils/color'

defineProps({
  portal: { type: Object as PropType<Portal>, required: true },
  closable: { type: Boolean, default: false },
})
defineEmits(['close'])

const { t } = useI18n()
</script>
