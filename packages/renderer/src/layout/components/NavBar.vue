<template>
  <div class="navbar">
    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link to="/editor" class="nav-btn">
          <n-icon class="w-full h-full">
            <AppsSharp class="!w-full !h-full" />
          </n-icon>
        </router-link>
      </template>
      Viewer
    </n-popover>

    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link to="/about" class="nav-btn">
          <n-icon class="w-full h-full">
            <InformationCircle class="!w-full !h-full" />
          </n-icon>
        </router-link>
      </template>
      About
    </n-popover>

    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link to="/settings" class="nav-btn">
          <n-icon class="w-full h-full">
            <SettingsSharp class="!w-full !h-full" />
          </n-icon>
        </router-link>
      </template>
      Settings
    </n-popover>
  </div>
</template>

<script lang="ts" setup>
import {
  Albums,
  AppsSharp,
  InformationCircle,
  SettingsSharp,
} from '@vicons/ionicons5'
import { NIcon, NPopover } from 'naive-ui'
</script>

<style lang="postcss" scoped>
.navbar {
  width: 50px;
  @apply flex flex-col flex-shrink-0 items-center py-5 gap-2;
  @apply bg-gray-600;
}
.nav-btn {
  @apply hover:bg-border px-3 py-2;
}
</style>
