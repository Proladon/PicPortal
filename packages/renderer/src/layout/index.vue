<template>
  <div class="layout">
    <TitleBar />

    <section class="main-wrapper">
      <Navbar />

      <!-- <router-view v-slot="{ Component }">
        <keep-alive include="Editor">
          <component :is="Component" class="main-view" />
        </keep-alive>
      </router-view> -->

      <keep-alive>
        <router-view class="main-view" />
      </keep-alive>
    </section>

    <StatusBar />
  </div>
</template>

<script lang="ts" setup>
import TitleBar from './components/TitleBar.vue'
import Navbar from './components/NavBar.vue'
import StatusBar from './components/StatusBar.vue'
</script>

<style lang="postcss" scoped>
.layout {
  @apply w-full h-full flex flex-col;
}
.main-wrapper {
  @apply flex flex-1 overflow-hidden;
}

.main-view {
  @apply overflow-y-auto;
}
</style>
