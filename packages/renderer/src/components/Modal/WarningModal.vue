<template>
  <GDialog
    v-model="showModal"
    width="30%"
    max-width="300px"
    @update:modelValue="closeModal"
  >
    <div class="p-5 text-center">
      <p>{{ title }}</p>
      <slot />
      <n-button @click=";[$emit('confirm'), closeModal()]">confirm</n-button>
      <n-button @click=";[$emit('cancel'), closeModal()]">cancel</n-button>
    </div>
  </GDialog>
</template>

<script lang="ts" setup>
import { ref } from '@vue/reactivity'
import { NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'

// --- Data ---
const emit = defineEmits(['close', 'confirm', 'cancel'])
defineProps({
  title: String,
})

const showModal = ref(true)

const closeModal = (): void => {
  showModal.value = false
  setTimeout(() => {
    emit('close')
  }, 150)
}
</script>

<style lang="postcss" scoped></style>
