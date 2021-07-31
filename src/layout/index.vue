<template>
  <div class="layout">
    <header class="text-teal-400">Picnel.io 3</header>
    <div class="view-wrapper">
      <div class="navbar">asdas</div>
      <splitpanes class="main">
        <pane v-if="tagPane === 'left'" class="side-pane">
          <header>
            <SZButton @click="tagPaneSide" type="primary">{{
              tagPane
            }}</SZButton>
            <SZButton @click="tagPaneSide" type="warning">test</SZButton>
          </header>
        </pane>

        <pane class="main-pane">
          <img
            src="https://cdna.artstation.com/p/assets/images/images/040/021/682/large/-.jpg?1627614974"
            alt=""
            srcset=""
          />
        </pane>

        <pane v-if="tagPane === 'right'" class="side-pane">
          <header>
            <SZButton @click="tagPaneSide" type="primary">{{
              tagPane
            }}</SZButton>
            <SZButton @click="tagPaneSide" type="warning">test</SZButton>
          </header>
        </pane>
      </splitpanes>
    </div>
    <footer>123</footer>
  </div>
</template>

<script lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Layout',
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
.view-wrapper {
  display: flex;
  flex: 1;
  transition: ease-in-out 0.3s;
}
.layout {
  @apply w-full h-full flex flex-col;
}

.navbar {
  @apply bg-gray-600;
}
footer {
  height: 30px;
  @apply bg-border;
}

.side-pane {
  background: #20232b;
}
</style>
