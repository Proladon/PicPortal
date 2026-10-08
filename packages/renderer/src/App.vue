<template>
  <TooltipProvider :delay-duration="400">
    <router-view />
    <PortalCommander
      v-if="appStore.commander.portal"
      @close="appStore.commander.portal = false"
    />
    <Toaster
      position="top-right"
      :offset="{ top: 48 }"
      :theme="isDark ? 'dark' : 'light'"
      rich-colors
    />
  </TooltipProvider>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { subscribeClose, cancelClose } from '/@/desktop/lifecycle'
import { reportDesktopError } from '/@/desktop/status'
import PortalCommander from '/@/components/Commander/PortalCommander.vue'
import { TooltipProvider } from '/@/components/ui/tooltip'
import { Toaster } from '/@/components/ui/sonner'

import useInit from '/@/use/init'
import { useTheme } from '/@/use/theme'
import { useAppStore } from '/@/store/appStore'

const { applySettings, isDark } = useTheme()
const router = useRouter()
const appStore = useAppStore()
const { init, dispose } = useInit()
let stopClose: (() => void) | undefined
let disposed = false
onUnmounted(() => {
  disposed = true
  stopClose?.()
  cancelClose()
  dispose()
})

onMounted(async () => {
  try {
    const stop = await subscribeClose()
    if (disposed) stop()
    else stopClose = stop
  } catch (error) {
    reportDesktopError(error)
  }
  if (disposed) return
  const settings = await init()
  if (disposed) return
  applySettings(settings?.general)
  router.push('/projects')
})
</script>
