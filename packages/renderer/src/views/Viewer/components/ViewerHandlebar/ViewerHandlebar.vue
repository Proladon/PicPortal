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
      <n-button @click="handleRefresh">
        <n-icon size="20"><Refresh /></n-icon>
      </n-button>
      <PerPageControl />
      <div class="w-[100px]">
        <n-slider
          v-model:value="viewerStore.gridView.imgSize"
          :min="150"
          :max="500"
        />
      </div>
    </div>

    <ViewerFilter class="right-fixed" v-model:show="showFilter" />
  </div>
</template>

<script lang="ts" setup>
import ViewModeSwitcher from './components/ViewModeSwitcher.vue'
import WrapingButton from './components/WrapingButton.vue'
import ViewerFilter from './components/ViewerFilter.vue'
import QuickActions from './components/QuickActions.vue'
import PerPageControl from './components/PerPageControl.vue'
import { NButton, NIcon, NSlider } from 'naive-ui'
import { Filter, Refresh } from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'
import { useViewerStore } from '/@/store/viewerStore'

const showFilter = ref(false)
const viewerStore = useViewerStore()

const handleRefresh = () => {
  viewerStore.signal.refresh = true
}
</script>

<style lang="postcss" scoped>
.viewer-handlebar {
  @apply pb-3;
}
.handlebar {
  @apply flex flex-wrap gap-[15px] justify-center items-center pt-3 rounded-md;
}

.handle-item {
  @apply flex items-center h-[32px];
}
</style>
