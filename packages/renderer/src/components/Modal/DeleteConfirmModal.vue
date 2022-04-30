<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="modal-body">
      <div class="header">
        <n-icon size="24"><Warning /></n-icon>
        <p>Warning</p>
      </div>
      <div class="py-[15px]">
        <p>Confirm Delete Project ?</p>
      </div>
      <div class="flex justify-end gap-[10px]">
        <n-button @click="updateModalShow(false)">Cancel</n-button>
        <n-button ghost type="error" @click="$emit('delete')">Delete</n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NButton, NIcon } from 'naive-ui/es'
import { Warning } from '@vicons/ionicons5'
import { onMounted } from '@vue/runtime-core'
import { ref } from '@vue/reactivity'

const emit = defineEmits(['close', 'delete'])
const showModal = ref<boolean>(false)

const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 300)
  }
  showModal.value = show
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
