<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    :on-update:show="updateModalShow"
  >
    <div class="modal-body">
      <div class="header">
        <n-icon size="24"><Warning /></n-icon>
        <p>{{ translate('common.warning') }}</p>
      </div>
      <div class="modal-content">
        <div class="preview-container">
          <img class="preview-img" :src="localFile(data.filePath)" />
          <div class="preview-path">{{ data.filePath }}</div>
        </div>
        <div class="preview-container">
          <img class="preview-img" :src="localFile(data.destPath)" />
          <div class="preview-path">{{ data.destPath }}</div>
        </div>
      </div>

      <div class="modal-footer">
        <n-button @click="updateModalShow(false)">{{
          translate('common.cancel')
        }}</n-button>
        <n-button ghost type="error" @click="emit('confirm')">{{
          translate('common.confirm')
        }}</n-button>
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
import { localFile } from '/@/utils/file'

const emit = defineEmits(['close', 'confirm'])

defineProps({
  data: {
    type: Object,
    default: () => ({}),
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

.modal-content {
  @apply py-[15px] flex justify-center gap-[50px];
}

.modal-footer {
  @apply flex justify-end gap-[10px] mt-[20px];
}

.preview-container {
  @apply flex items-center justify-start flex-col gap-[20px];
}
.preview-img {
  @apply w-[200px] h-[200px] object-cover;
}
.preview-path {
  @apply w-[200px] break-all;
}
</style>
