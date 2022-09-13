<template>
  <n-tag
    type="info"
    class="p-4 cursor-pointer"
    @click="showModeChangeModal = true"
  >
    <div class="handle-item">
      <n-icon><BrowsersOutline /></n-icon>
      <span class="ml-2 text-gray-300">{{ $route.name }}</span>
    </div>
  </n-tag>

  <ModeChangeModal
    v-if="showModeChangeModal"
    @close="showModeChangeModal = false"
  />
</template>

<script setup lang="ts">
import ModeChangeModal from './ModeChangeModal.vue'
import { NTag, NIcon } from 'naive-ui'
import { BrowsersOutline } from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'

const showModeChangeModal = ref<boolean>(false)
</script>

<style scoped lang="postcss"></style>
