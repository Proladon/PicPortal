<template>
  <header
    class="title-bar flex h-9 shrink-0 select-none items-center border-b border-sidebar-border bg-sidebar text-sidebar-foreground"
    :style="
      desktop.runtime === 'electron' ? '-webkit-app-region: drag' : undefined
    "
    @mousedown="dragWindow"
  >
    <section
      class="app-logo flex h-full w-12 shrink-0 items-center justify-center"
    >
      <span
        class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm"
      >
        <Aperture class="size-4" />
      </span>
    </section>
    <section class="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
      <span class="font-semibold tracking-tight"
        ><span class="app-name">PicPortal</span></span
      >
      <template v-if="appStore.projectName">
        <ChevronRight class="size-3.5 shrink-0 text-muted-foreground" />
        <span class="truncate text-muted-foreground">{{
          appStore.projectName
        }}</span>
      </template>
    </section>
    <section
      class="win-btn-container flex h-full shrink-0"
      style="-webkit-app-region: no-drag"
      @mousedown.stop
    >
      <button
        type="button"
        class="win-btn min"
        :aria-label="t('app.window.minimize')"
        @click="minWin"
      >
        <Minus class="size-4" />
      </button>
      <button
        type="button"
        class="win-btn max"
        :aria-label="t('app.window.maximize')"
        @click="maxWin"
      >
        <Square class="size-3.5" />
      </button>
      <button
        type="button"
        class="win-btn close hover:!bg-destructive hover:!text-white"
        :aria-label="t('app.window.close')"
        @click="closeWin"
      >
        <X class="size-4" />
      </button>
    </section>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Aperture, ChevronRight, Minus, Square, X } from '@lucide/vue'
import { useDesktop } from '/@/desktop'
import { useAppStore } from '/@/store/appStore'

const { t } = useI18n()
const appStore = useAppStore()
const desktop = useDesktop()
const { appWindow } = desktop

const dragWindow = async (event: MouseEvent) => {
  if (desktop.runtime === 'tauri' && event.button === 0)
    await appWindow.startDragging()
}

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

<style scoped>
.win-btn {
  display: inline-flex;
  height: 100%;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
  transition: background-color 0.15s, color 0.15s;
}
.win-btn:hover {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}
</style>
