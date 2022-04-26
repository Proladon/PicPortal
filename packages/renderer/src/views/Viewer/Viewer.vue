<template>
  <div class="viewer">
    <splitpanes v-if="portalPanelPosition === 'right'">
      <pane>
        <router-view></router-view>
      </pane>
      <pane size="30">
        <PortalTagPanel />
      </pane>
    </splitpanes>

    <splitpanes v-if="portalPanelPosition === 'left'">
      <pane size="30">
        <PortalTagPanel />
      </pane>
      <pane>
        <router-view></router-view>
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import PortalTagPanel from './components/PortalTagPanel/PortalTagPanel.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useViewerStore } from '/@/store/viewerStore'
import { computed } from '@vue/reactivity'

const viewerStore = useViewerStore()
const portalPanelPosition = computed(() => viewerStore.portalPanelPosition)
</script>

<style scoped lang="postcss">
.viewer {
  @apply w-full h-full;
}
</style>
