<template>
  <div
    class="save-dialog pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6"
  >
    <div
      class="pointer-events-auto flex items-center gap-6 rounded-xl border bg-popover py-2 pr-2 pl-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 animate-in fade-in-0 slide-in-from-bottom-4"
    >
      <p class="flex items-center gap-2">
        <CircleAlert class="size-4 text-warning" />
        {{ t('settings.saveWarning') }}
      </p>
      <div class="flex gap-2">
        <Button size="sm" variant="ghost" @click="$emit('cancel')">
          {{ t('common.reset') }}
        </Button>
        <Button size="sm" @click="$emit('save')">
          {{ t('common.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleAlert } from '@lucide/vue'
import { Button } from '/@/components/ui/button'

defineEmits(['cancel', 'save'])
const { t } = useI18n()
</script>
