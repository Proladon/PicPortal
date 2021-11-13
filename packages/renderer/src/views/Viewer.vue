<template>
  <div class="viewer">
    <splitpanes v-if="viewerSide === 'left'">
      <pane>
        <router-view></router-view>
      </pane>
      <pane size="30">
        <PortalTagPane />
      </pane>
    </splitpanes>

    <splitpanes v-if="viewerSide === 'right'">
      <pane size="30">
        <PortalTagPane />
      </pane>
      <pane>
        <router-view></router-view>
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import PortalTagPane from '/@/components/PortalTagPane/index.vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useStore } from 'vuex'
import { computed } from '@vue/reactivity'

const store = useStore()
const viewerSide = computed(() => store.state.viewer.viewerSide)
</script>

<style scoped lang="postcss">
.viewer {
  @apply w-full h-full;
}
</style>
