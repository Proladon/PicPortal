<template>
  <section class="viewer-handle-bar">
    <n-tag
      type="info"
      class="p-4 cursor-pointer"
      @click="showModeChangeModal = true"
    >
      <div class="handle-item">
        <n-icon><BrowsersOutline /></n-icon>
        <span class="ml-2 text-gray-300">Multiple</span>
      </div>
    </n-tag>

    <n-tag type="warning" class="p-4 cursor-pointer">
      <div class="handle-item">
        <n-icon><BrowsersOutline /></n-icon>
        <span class="ml-2 text-gray-300">Portals > Pics</span>
      </div>
    </n-tag>
  </section>

  <ModeChangeModal
    v-if="showModeChangeModal"
    @close="showModeChangeModal = false"
  />
</template>

<script lang="ts" setup>
import ModeChangeModal from './Modal/ModeChangeModal.vue'
import { NIcon, NTag } from 'naive-ui'
import { BrowsersOutline } from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'

const showModeChangeModal = ref(false)
</script>

<style lang="postcss" scoped>
.viewer-handle-bar {
  @apply flex gap-2 justify-center items-center;
}

.handle-item {
  @apply flex items-center;
}
</style>
