<template>
  <n-tooltip :delay="500" trigger="hover" placement="bottom-center">
    <template #trigger>
      <n-input-number
        class="w-[100px]"
        :max="100"
        :min="10"
        v-model:value="viewerStore.gridView.perPage"
        @change="viewerStore.signal.refresh = true"
      />
    </template>
    items perpage
  </n-tooltip>
</template>

<script setup lang="ts">
import { NInputNumber, NTooltip } from 'naive-ui'
import { useViewerStore } from '/@/store/viewerStore'
const viewerStore = useViewerStore()
</script>

<style scoped lang="postcss"></style>
