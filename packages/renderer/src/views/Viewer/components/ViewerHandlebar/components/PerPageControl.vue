<template>
  <n-tooltip :delay="500" trigger="hover" placement="bottom">
    <template #trigger>
      <n-input-number
        class="w-[100px]"
        :max="100"
        :min="10"
        v-model:value="viewerStore.gridView.perPage"
        :on-update:value="onChange"
      />
    </template>
    items perpage
  </n-tooltip>
</template>

<script setup lang="ts">
import { NInputNumber, NTooltip } from 'naive-ui'
import { useViewerStore } from '/@/store/viewerStore'
const viewerStore = useViewerStore()

const onChange = (val: number | null) => {
  viewerStore.gridView.perPage = val || 10
  viewerStore.signal.refresh = true
}
</script>

<style scoped lang="postcss"></style>
