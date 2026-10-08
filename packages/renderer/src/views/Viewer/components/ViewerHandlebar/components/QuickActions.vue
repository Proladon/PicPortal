<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        class="quick-actions"
        variant="ghost"
        size="icon-sm"
        :aria-label="t('viewer.toolbar.quickActions')"
        :title="t('viewer.toolbar.quickActions')"
      >
        <Zap />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-52">
      <DropdownMenuLabel>{{
        t('viewer.toolbar.quickActions')
      }}</DropdownMenuLabel>
      <DropdownMenuItem
        variant="destructive"
        :disabled="!viewerStore.dockings.length"
        @select="handleSelect('clear dockings')"
      >
        <Eraser />
        {{ t('viewer.quickActions.clearDockings.label') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <ConfirmDialog
    v-if="showWarning"
    :keyRef="selectedKey"
    :title="t('viewer.quickActions.clearDockings.label')"
    :content="modalContent"
    @close="showWarning = false"
    @confirm="handleWarningConfirm"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Eraser, Zap } from '@lucide/vue'
import ConfirmDialog from '/@/components/ConfirmDialog.vue'
import { Button } from '/@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '/@/components/ui/dropdown-menu'
import { useViewerStore } from '/@/store/viewerStore'

const viewerStore = useViewerStore()
const { t } = useI18n()

const selectedKey = ref('')
const modalContent = ref('')
const showWarning = ref(false)

const handleSelect = (key: string) => {
  if (key === 'clear dockings') {
    selectedKey.value = key
    modalContent.value = t('viewer.quickActions.clearDockings.warning')
    showWarning.value = true
  }
}

const handleWarningConfirm = async (key: string) => {
  if (key === 'clear dockings') {
    await clearDockings()
    toast.success(t('viewer.notify.dockingsCleared'), { duration: 2000 })
  }
}

const clearDockings = async () => {
  await viewerStore.ClearDockings()
}
</script>
