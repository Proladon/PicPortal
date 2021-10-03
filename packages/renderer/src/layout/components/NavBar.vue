<template>
  <div class="navbar">
    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link to="/home" class="nav-btn">
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
  </div>
</template>

<script lang="ts" setup>
import { Albums, AppsSharp, InformationCircle } from '@vicons/ionicons5'
import { NIcon, NPopover } from 'naive-ui'
</script>

<style lang="postcss" scoped>
.navbar {
  width: 50px;
  @apply flex flex-col flex-shrink-0 items-center py-2;
  @apply bg-gray-600;
}
.nav-btn {
  @apply hover:bg-border px-2;
}
</style>
