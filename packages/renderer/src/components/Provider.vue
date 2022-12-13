<template>
  <n-config-provider
    :theme="darkTheme"
    class="h-full"
    :theme-overrides="appStore.theme"
  >
    <!-- <NThemeEditor> -->
    <n-global-style />
    <!-- <n-loading-bar-provider> -->
    <n-notification-provider placement="top-right">
      <n-message-provider>
        <n-dialog-provider>
          <slot />
        </n-dialog-provider>
      </n-message-provider>
    </n-notification-provider>
    <!-- </n-loading-bar-provider> -->
    <!-- </NThemeEditor> -->
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NGlobalStyle,
  NNotificationProvider,
  NMessageProvider,
  NDialogProvider,
  darkTheme,
  NThemeEditor,
} from 'naive-ui'
import { useAppStore } from '/@/store/appStore'

const appStore = useAppStore()
</script>

<style lang="postcss" scoped></style>
