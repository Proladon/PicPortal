<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="modal-body">
      <n-input
        v-model:value="selected"
        autofocus
        placeholder="Please select a song"
      />
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NInput } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { useModal } from '/@/use/modal'

const emit = defineEmits(['close', 'confirm'])
const { updateModalShow, showModal } = useModal(emit)

const selected = ref('')

onMounted(() => {
  updateModalShow(true)
})
</script>

<style scoped lang="postcss">
.modal-body {
  @apply bg-primary-bg p-5 min-w-[300px] rounded-lg;
}
</style>
