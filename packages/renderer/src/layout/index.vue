<template>
  <div class="layout">
    <header class="text-teal-400">Picnel.io 3</header>

    <section class="main-wrapper">
      <Navbar />

      <router-view />
    </section>

    <StatusBar />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Navbar from './components/NavBar.vue'
import StatusBar from './components/StatusBar.vue'
export default defineComponent({
  name: 'Layout',
  components: { Navbar, StatusBar }
})
</script>

<style lang="postcss" scoped>
.layout {
  @apply w-full h-full flex flex-col;
}
.main-wrapper {
  @apply flex flex-1;
}
</style>
