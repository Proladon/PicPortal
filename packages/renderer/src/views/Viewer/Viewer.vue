<template>
  <div class="view-page h-full w-full">
    <Empty v-if="!appStore.openProject" class="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanban />
        </EmptyMedia>
        <EmptyTitle>{{ t('viewer.noProject.title') }}</EmptyTitle>
        <EmptyDescription>{{
          t('viewer.noProject.description')
        }}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" as-child>
          <router-link :to="{ name: 'Projects' }">
            {{ t('viewer.noProject.goProjects') }}
            <ArrowRight />
          </router-link>
        </Button>
      </EmptyContent>
    </Empty>

    <ResizablePanelGroup
      v-else
      :key="portalPanelPosition"
      direction="horizontal"
      :auto-save-id="`picportal-viewer-${portalPanelPosition}`"
    >
      <template v-if="portalPanelPosition === 'left'">
        <ResizablePanel
          :order="1"
          :default-size="30"
          :min-size="22"
          :max-size="50"
        >
          <PortalTagPanel />
        </ResizablePanel>
        <ResizableHandle with-handle />
        <ResizablePanel :order="2" :min-size="35">
          <router-view></router-view>
        </ResizablePanel>
      </template>
      <template v-else>
        <ResizablePanel :order="1" :min-size="35">
          <router-view></router-view>
        </ResizablePanel>
        <ResizableHandle with-handle />
        <ResizablePanel
          :order="2"
          :default-size="30"
          :min-size="22"
          :max-size="50"
        >
          <PortalTagPanel />
        </ResizablePanel>
      </template>
    </ResizablePanelGroup>
  </div>
  <FileExistModal
    :data="filesExist"
    v-if="filesExistCount > 0"
    :key="filesExist.id"
  />
</template>

<script setup lang="ts">
import FileExistModal from '/@/components/Modal/FileExistModal.vue'
import PortalTagPanel from './components/PortalTagPanel/PortalTagPanel.vue'
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, FolderKanban } from '@lucide/vue'
import hotkeys from 'hotkeys-js'
import { Button } from '/@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '/@/components/ui/empty'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '/@/components/ui/resizable'
import { useViewerStore } from '/@/store/viewerStore'
import { useAppStore } from '/@/store/appStore'

const { t } = useI18n()
const appStore = useAppStore()
const viewerStore = useViewerStore()
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
const filesExistCount = computed(() => viewerStore.wrap.filesExist.length)
const filesExist = computed(() => viewerStore.wrap.filesExist[0] || {})

onMounted(() => {
  hotkeys.setScope('viewer')
})

onUnmounted(() => {
  hotkeys.setScope('all')
})
</script>
