<template>
  <div class="navbar">
    <div class="nav-list">
      <n-popover trigger="hover" placement="right">
        <template #trigger>
          <router-link
            :to="{ name: lastViewerType }"
            class="nav-btn"
            :class="{ 'nav--actived': viewerTypes.includes($route.name) }"
          >
            <img :src="hh" alt="info" />
          </router-link>
        </template>
        Viewer
      </n-popover>

      <n-popover trigger="hover" placement="right">
        <template #trigger>
          <router-link
            :to="{ name: 'Projects' }"
            class="nav-btn"
            :class="{ 'nav--actived': $route.name === 'Projects' }"
          >
            <img :src="RecordIcon" alt="" />
          </router-link>
        </template>
        Projects
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
    </div>

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
import { useViewerStore } from '/@/store/viewerStore'
import { computed } from '@vue/reactivity'

const viewerStore = useViewerStore()
const lastViewerType = computed(() => viewerStore.lastViewerType)
const viewerTypes = ['GridView', 'VirtualGrid', 'VirtualList', 'FocusView']
</script>

<style lang="postcss" scoped>
.navbar {
  width: 50px;
  @apply flex flex-col justify-between items-center py-5 flex-shrink-0;
  @apply bg-tertiary-bg;
}

.nav-list {
  @apply flex flex-col gap-7;
}

.nav-btn {
  @apply px-3 py-2;

  img {
    filter: grayscale(1);
  }
}

.nav--actived {
  @apply relative;
}
.nav--actived::after {
  content: '';
  @apply absolute left-0 h-auto top-0 bottom-0 w-[4px] bg-emerald-300;
  @apply transition duration-300 ease-in;
  animation: expand 0.3s;
}

@keyframes expand {
  0% {
    @apply w-0;
  }
  100% {
    @apply w-[4px];
  }
}
</style>
