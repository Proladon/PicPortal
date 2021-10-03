<template>
  <section class="viewer-handle-bar">
    <n-tag type="info" class="p-4 cursor-pointer">
      <div class="flex items-center">
        <n-icon><BrowsersOutline /></n-icon>
        <span class="ml-2 text-teal-300">Mode</span>
      </div>
    </n-tag>
  </section>
</template>

<script setup>
import { NIcon, NTag } from 'naive-ui'
import { BrowsersOutline } from '@vicons/ionicons5'
</script>

<style lang="postcss" scoped></style>
