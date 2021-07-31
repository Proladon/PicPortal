<template>
  <splitpanes class="main">
    <!-- Left Pane -->
    <pane v-if="tagPane === 'left'" class="side-pane" size="20">
      <header>
        <trash-icon class="text-gray-300" />
        <arrow-bar-to-right-icon class="text-gray-300" @click="tagPaneSide" />
      </header>
    </pane>

    <!-- Main View Pane -->
    <pane class="main-pane">
      <img
        src="https://cdna.artstation.com/p/assets/images/images/040/021/682/large/-.jpg?1627614974"
        alt=""
        srcset=""
      />
    </pane>

    <!-- Right Pane -->
    <pane v-if="tagPane === 'right'" class="side-pane" size="20">
      <header>
        <arrow-bar-to-left-icon class="text-gray-300" @click="tagPaneSide" />
      </header>
    </pane>
  </splitpanes>
</template>

<script lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Home',
  components: { Splitpanes, Pane },
  setup() {
    const store = useStore()
    const tagPane = computed(() => store.state.tagPane)

    const tagPaneSide = () => {
      store.commit('EXCHANGE_TAG_PANE_SIDE')
    }

    return { tagPane, tagPaneSide }
  }
})
</script>

<style lang="postcss">
.splitpanes {
}

.splitpanes__splitter {
  @apply bg-border;
  position: relative;
}
.splitpanes__splitter:before {
  @apply bg-border;
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.4s;
  opacity: 0;
  z-index: 1;
}

.splitpanes__splitter:hover:before {
  opacity: 0.3;
}
.splitpanes__splitter:before {
  left: -10px;
  right: -10px;
  height: 100%;
}
</style>

<style lang="postcss" scoped>
.main {
  @apply w-full;
}

.side-pane {
  background: #20232b;
}
</style>
