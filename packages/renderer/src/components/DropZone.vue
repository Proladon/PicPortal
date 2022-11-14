<template>
  <n-button ref="dropZoneRef" class="cursor-default h-full" dashed block>
    <n-icon size="24" :depth="3">
      <Archive />
    </n-icon>
  </n-button>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core'
import { NButton, NIcon } from 'naive-ui'
import { Archive } from '@vicons/ionicons5'
import { ref } from 'vue'

const dropZoneRef = ref<HTMLButtonElement>()
const emit = defineEmits(['drop'])

const onDrop = (files: File[] | null) => {
  emit('drop', files)
}

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop)
</script>

<style scoped lang="postcss"></style>
