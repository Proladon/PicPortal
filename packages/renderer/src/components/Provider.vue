<template>
  <!-- <NThemeEditor> -->
  <n-config-provider :theme="darkTheme" class="h-full">
    <n-global-style />
    <!-- <n-loading-bar-provider> -->
    <n-notification-provider placement="bottom-right">
      <n-message-provider>
        <n-dialog-provider>
          <slot />
        </n-dialog-provider>
      </n-message-provider>
    </n-notification-provider>
    <!-- </n-loading-bar-provider> -->
  </n-config-provider>
  <!-- </NThemeEditor> -->
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NGlobalStyle,
  NNotificationProvider,
  NMessageProvider,
  NDialogProvider,
  darkTheme
} from 'naive-ui/es'
</script>

<style lang="postcss" scoped></style>
