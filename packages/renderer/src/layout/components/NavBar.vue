<template>
  <nav
    class="navbar flex w-12 shrink-0 select-none flex-col items-center justify-between border-r border-sidebar-border bg-sidebar py-2"
  >
    <div class="nav-list flex flex-col items-center gap-1">
      <Tooltip v-for="item in items" :key="item.key">
        <TooltipTrigger as-child>
          <router-link
            :to="item.to"
            class="nav-btn"
            :class="{ 'nav--actived': item.active }"
            :aria-label="t(`app.nav.${item.key}`)"
          >
            <component :is="item.icon" class="size-[18px]" />
          </router-link>
        </TooltipTrigger>
        <TooltipContent side="right">{{
          t(`app.nav.${item.key}`)
        }}</TooltipContent>
      </Tooltip>
    </div>

    <Tooltip>
      <TooltipTrigger as-child>
        <router-link
          to="/settings"
          class="nav-btn"
          :class="{ 'nav--actived': $route.name === 'Settings' }"
          :aria-label="t('app.nav.settings')"
        >
          <Settings class="size-[18px]" />
        </router-link>
      </TooltipTrigger>
      <TooltipContent side="right">{{ t('app.nav.settings') }}</TooltipContent>
    </Tooltip>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { FolderKanban, Images, Info, Settings } from '@lucide/vue'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { useViewerStore } from '/@/store/viewerStore'

const { t } = useI18n()
const route = useRoute()
const viewerStore = useViewerStore()
const viewerTypes = [
  'GridView',
  'ListView',
  'VirtualGrid',
  'VirtualList',
  'FocusView',
]

const items = computed(() => [
  {
    key: 'viewer',
    icon: Images,
    to: { name: viewerStore.lastViewerType },
    active: viewerTypes.includes(String(route.name || '')),
  },
  {
    key: 'projects',
    icon: FolderKanban,
    to: { name: 'Projects' },
    active: route.name === 'Projects',
  },
  {
    key: 'about',
    icon: Info,
    to: '/about',
    active: route.name === 'About',
  },
])
</script>

<style scoped>
.nav-btn {
  position: relative;
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 0.5rem);
  color: var(--muted-foreground);
  transition: background-color 0.15s, color 0.15s;
}
.nav-btn:hover {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}
.nav-btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.nav--actived {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-primary);
}
.nav--actived::before {
  content: '';
  position: absolute;
  left: -0.375rem;
  top: 50%;
  height: 1.125rem;
  width: 3px;
  translate: 0 -50%;
  border-radius: 9999px;
  background-color: var(--sidebar-primary);
  animation: nav-indicator 0.2s ease-out;
}
@keyframes nav-indicator {
  from {
    height: 0;
  }
}
</style>
