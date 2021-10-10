<template>
  <div class="home">
    <splitpanes>
      <pane>
        <Viewer />
      </pane>
      <pane size="30">
        <PortalTagPane />
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import Viewer from '/@/components/Viewer/index.vue'
import PortalTagPane from '/@/components/PortalTagPane/index.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
</script>

<style scoped lang="postcss">
.home {
  @apply w-full h-full;
}
</style>
