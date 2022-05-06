<template>
  <div class="viewer-handlebar">
    <div class="handlebar">
      <ViewModeSwitcher />
      <WrapingButton />
      <QuickActions />
      <n-button
        class="handle-item"
        :type="showFilter ? 'primary' : ''"
        ghost
        @click="showFilter = !showFilter"
      >
        <n-icon size="20"><Filter /></n-icon>
      </n-button>
    </div>

    <ViewerFilter class="right-fixed" v-model:show="showFilter" />
  </div>
</template>

<script lang="ts" setup>
import ViewModeSwitcher from './components/ViewModeSwitcher.vue'
import WrapingButton from './components/WrapingButton.vue'
import ViewerFilter from './components/ViewerFilter.vue'
import QuickActions from './components/QuickActions.vue'
import { NButton, NIcon } from 'naive-ui/es'
import { Filter } from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'

const showFilter = ref(false)
</script>

<style lang="postcss" scoped>
.viewer-handlebar {
  @apply pb-3;
}
.handlebar {
  @apply flex gap-2 justify-center items-center pt-3 rounded-md;
}

.handle-item {
  @apply flex items-center h-[32px];
}
</style>
