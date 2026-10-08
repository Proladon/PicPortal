<template>
  <AlertDialog :open="showModal" @update:open="updateModalShow">
    <AlertDialogContent class="confirm-dialog">
      <AlertDialogHeader>
        <AlertDialogMedia :class="mediaClass">
          <component :is="icon" />
        </AlertDialogMedia>
        <AlertDialogTitle>{{ title || t('common.warning') }}</AlertDialogTitle>
        <AlertDialogDescription>
          <template v-if="content">{{ content }}</template>
          <slot />
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction
          class="confirm-action"
          :variant="type === 'destructive' ? 'destructive' : 'default'"
          @click="emit('confirm', keyRef)"
        >
          {{ confirmText || t('common.confirm') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { Info, TriangleAlert } from '@lucide/vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '/@/components/ui/alert-dialog'
import { useModal } from '/@/use/modal'

const props = defineProps({
  type: {
    type: String as PropType<'destructive' | 'default'>,
    default: 'destructive',
  },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  confirmText: { type: String, default: '' },
  /** Passed back with `confirm`, for callers that share one dialog. */
  keyRef: { type: String, default: '' },
})
const emit = defineEmits(['close', 'confirm'])

const { t } = useI18n()
const { showModal, updateModalShow } = useModal(emit)

const icon = computed(() =>
  props.type === 'destructive' ? TriangleAlert : Info
)
const mediaClass = computed(() =>
  props.type === 'destructive'
    ? 'bg-destructive/10 text-destructive'
    : 'bg-primary/10 text-primary'
)

onMounted(() => {
  showModal.value = true
})
</script>
