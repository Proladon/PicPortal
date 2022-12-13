<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="modal-body">
      <div class="header">
        <n-icon size="24"><Warning /></n-icon>
        <p>{{ translate('common.warning') }}</p>
      </div>
      <div class="py-[15px]">
        <p>{{ content }}</p>
      </div>
      <div class="flex justify-end gap-[10px]">
        <n-button secondary @click="updateModalShow(false)">{{
          translate('common.cancel')
        }}</n-button>
        <n-button secondary type="error" @click="$emit('confirm')">{{
          translate('common.confirm')
        }}</n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NButton, NIcon } from 'naive-ui'
import { Warning } from '@vicons/ionicons5'
import { onMounted } from '@vue/runtime-core'
import { useModal } from '/@/use/modal'
import useLocale from '/@/use/locale'

const emit = defineEmits(['close', 'confirm'])

defineProps({
  content: {
    type: String,
    default: '',
  },
})
const { translate } = useLocale()
const { updateModalShow, showModal } = useModal(emit)

onMounted(() => {
  showModal.value = true
})
</script>

<style lang="postcss" scoped>
.modal-body {
  @apply bg-primary-bg p-5 min-w-[300px];
}

.header {
  @apply flex items-end justify-start gap-[10px] text-[20px] text-red-400;
}
</style>
