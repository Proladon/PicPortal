<template>
  <header class="title-bar" style="-webkit-app-region: drag">
    <section class="app-logo">
      <n-icon size="30">
        <LogoGithub />
      </n-icon>
    </section>
    <section class="app-name">PicPortal</section>
    <section class="win-btn-container">
      <div class="win-btn min" @click="minWin"></div>
      <div class="win-btn max" @click="maxWin"></div>
      <div class="win-btn close" @click="closeWin"></div>
    </section>
  </header>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LogoGithub } from '@vicons/ionicons5'
import { useElectron } from '/@/use/electron'
const { appWindow } = useElectron()

const closeWin = async () => {
  await appWindow.close()
}

const minWin = async () => {
  await appWindow.minimum()
}

const maxWin = async () => {
  await appWindow.maximum()
}
</script>

<style lang="postcss" scoped>
.title-bar {
  @apply grid grid-cols-3   items-center;
}

.app-logo {
  @apply text-left bg-border w-[50px] grid place-content-center py-2;
}

.app-name {
  @apply text-[var(--primary-font)] font-bold;
}

.min,
.max,
.close {
  @apply w-[20px] h-[20px] rounded-full;
}

.win-btn-container {
  @apply flex gap-[20px] justify-end px-[15px];
}
.win-btn {
  @apply border-2 border-solid cursor-pointer;
  -webkit-app-region: no-drag;
}

.min {
  @apply border-[#649FA0];
}
.max {
  @apply border-[#E2A739];
}
.close {
  @apply border-[#D44172];
}
</style>
