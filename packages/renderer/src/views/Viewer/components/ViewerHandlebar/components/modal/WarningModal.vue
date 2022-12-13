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
        <n-button secondary type="error" @click="confirm">{{
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
import { ref } from '@vue/reactivity'
import useLocale from '/@/use/locale'

const props = defineProps({
  keyRef: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['close', 'confirm'])

const { translate } = useLocale()

const showModal = ref<boolean>(false)

const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 300)
  }
  showModal.value = show
}

const confirm = () => {
  emit('confirm', props.keyRef)
  updateModalShow(false)
}

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
