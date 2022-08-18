<template>
  <n-modal
    :close-on-esc="false"
    :mask-closable="false"
    v-model:show="showModal"
    :on-update:show="updateModalShow"
  >
    <div class="modal-body">
      <div class="header">
        <n-icon size="24"><Warning /></n-icon>
        <p>{{ translate('common.warning') }}</p>
      </div>
      <div class="py-[15px]">尚無開啟專案</div>
      <div class="flex justify-end gap-[10px]">
        <router-link :to="{ name: 'Projects' }">
          <n-button ghost type="error" @click="$emit('confirm')">
            前往專案
          </n-button>
        </router-link>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NButton, NIcon } from 'naive-ui/es'
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
