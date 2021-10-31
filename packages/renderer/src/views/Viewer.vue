<template>
  <div class="home">
    <splitpanes>
      <pane>
        <router-view></router-view>
      </pane>
      <pane size="30">
        <PortalTagPane />
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import PortalTagPane from '/@/components/PortalTagPane/index.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
</script>

<style scoped lang="postcss">
.home {
  @apply w-full h-full;
}
</style>
