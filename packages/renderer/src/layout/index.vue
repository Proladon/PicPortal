<template>
  <div class="layout">
    <TitleBar />
    <n-alert v-if="desktopError" class="desktop-status" type="warning" closable @close="desktopError = ''">
      {{ desktopError }}
    </n-alert>

    <section class="main-wrapper">
      <Navbar />
      <router-view />
    </section>

    <StatusBar />
  </div>
</template>

<script lang="ts" setup>
import TitleBar from './components/TitleBar.vue'
import Navbar from './components/NavBar.vue'
import StatusBar from './components/StatusBar.vue'
import { NAlert } from 'naive-ui'
import { desktopError } from '/@/desktop/status'
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
