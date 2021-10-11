<template>
  <div class="navbar">
    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link
          to="/editor"
          class="nav-btn"
          :class="{ 'nav--actived': $route.name === 'Editor' }"
        >
          <img :src="hh" alt="info" />
        </router-link>
      </template>
      Viewer
    </n-popover>

    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link
          to="/settings"
          class="nav-btn"
          :class="{ 'nav--actived': $route.name === 'Record' }"
        >
          <img :src="RecordIcon" alt="" />
        </router-link>
      </template>
      Record
    </n-popover>

    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link
          to="/about"
          class="nav-btn"
          :class="{ 'nav--actived': $route.name === 'About' }"
        >
          <img class="h-full w-full" :src="InfoIcon" alt="info" />
        </router-link>
      </template>
      About
    </n-popover>

    <n-popover trigger="hover" placement="right">
      <template #trigger>
        <router-link
          to="/settings"
          class="nav-btn"
          :class="{ 'nav--actived': $route.name === 'Settings' }"
        >
          <img :src="SettingsIcon" alt="" />
        </router-link>
      </template>
      Settings
    </n-popover>
  </div>
</template>

<script lang="ts" setup>
import hh from '/@/assets/icon/home.svg'
import SettingsIcon from '/@/assets/icon/settings.svg'
import InfoIcon from '/@/assets/icon/info.svg'
import RecordIcon from '/@/assets/icon/book.svg'
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
  @apply flex flex-col flex-shrink-0 items-center py-5 gap-7;
  @apply bg-gray-600;
}
.nav-btn {
  @apply hover:bg-border px-3 py-2;

  img {
    filter: grayscale(1);
  }
}

.nav--actived {
  @apply bg-[var(--border-1)];
}
</style>
