<template>
  <div class="home">
    <splitpanes>
      <pane>
        <Viewer />
      </pane>
      <pane size="20">
        <ProtalTagPane />
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import Viewer from '/@/components/Viewer/index.vue'
import ProtalTagPane from '/@/components/ProtalTagPane/index.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { onMounted } from '@vue/runtime-core'
</script>

<style scoped lang="postcss">
.home {
  @apply w-full h-full;
}
</style>
