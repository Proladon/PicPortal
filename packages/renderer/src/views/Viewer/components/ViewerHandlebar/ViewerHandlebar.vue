<template>
  <div class="viewer-handlebar shrink-0 px-4 py-2.5">
    <div class="handlebar flex flex-wrap items-center gap-2">
      <ViewModeSwitcher />
      <Separator orientation="vertical" class="mx-0.5 !h-5" />
      <ViewerFilter />
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="t('viewer.toolbar.refresh')"
            @click="handleRefresh"
          >
            <RefreshCw
              :class="{ 'animate-spin': viewerStore.signal.refresh }"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ t('viewer.toolbar.refresh') }}</TooltipContent>
      </Tooltip>
      <QuickActions v-if="!readOnly" />

      <div class="ml-auto flex items-center gap-3">
        <template v-if="$route.name === 'GridView'">
          <Tooltip>
            <TooltipTrigger as-child>
              <div class="flex w-32 items-center gap-2 text-muted-foreground">
                <ImageIcon class="size-3.5 shrink-0" />
                <Slider
                  v-model="imageSize"
                  :min="150"
                  :max="500"
                  :step="10"
                  :aria-label="t('viewer.toolbar.imageSize')"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{{ t('viewer.toolbar.imageSize') }}</TooltipContent>
          </Tooltip>
          <PerPageControl />
        </template>
        <WrapingButton />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ViewModeSwitcher from './components/ViewModeSwitcher.vue'
import WrapingButton from './components/WrapingButton.vue'
import ViewerFilter from './components/ViewerFilter.vue'
import QuickActions from './components/QuickActions.vue'
import PerPageControl from './components/PerPageControl.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Image as ImageIcon, RefreshCw } from '@lucide/vue'
import { Button } from '/@/components/ui/button'
import { Separator } from '/@/components/ui/separator'
import { Slider } from '/@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'

const { t } = useI18n()
const readOnly = computed(() => useAppStore().readOnly)
const viewerStore = useViewerStore()

const imageSize = computed({
  get: () => [viewerStore.gridView.imgSize],
  set: (value: number[] | undefined) => {
    if (value?.length) viewerStore.gridView.imgSize = value[0]
  },
})

const handleRefresh = () => {
  viewerStore.signal.refresh = true
}
</script>
