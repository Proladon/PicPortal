<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-5 text-center bg-primary-bg">
      <p>{{ title }}</p>
      <slot />
      <n-button @click=";[$emit('confirm'), closeModal()]">confirm</n-button>
      <n-button @click=";[$emit('cancel'), closeModal()]">cancel</n-button>
    </div>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref } from '@vue/reactivity'
import { NModal, NButton, NForm, NFormItem, NInput } from 'naive-ui/es'
import { GDialog } from 'gitart-vue-dialog'

// --- Data ---
const emit = defineEmits(['close', 'confirm', 'cancel'])
defineProps({
  title: String
})

const showModal = ref(true)

const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 1500)
  }
  showModal.value = show
}

const closeModal = (): void => {
  showModal.value = false
  setTimeout(() => {
    emit('close')
  }, 150)
}
</script>

<style lang="postcss" scoped></style>
