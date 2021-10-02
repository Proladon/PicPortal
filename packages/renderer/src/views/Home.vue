<template>
  <div class="home">
    <splitpanes>
      <pane size="20">
        <TreeView />
      </pane>
      <pane>
        <Viewer />
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import Viewer from '/@/components/Viewer/index.vue'
import TreeView from '/@/components/TreeView/index.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
</script>

<style scoped lang="postcss">
.home {
  @apply w-full h-full;
}
</style>
