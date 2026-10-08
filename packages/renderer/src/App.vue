<template>
  <Provider>
    <router-view />
    <PortalCommander
      v-if="appStore.commander.portal"
      @close="appStore.commander.portal = false"
    />
  </Provider>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { subscribeClose, cancelClose } from '/@/desktop/lifecycle'
import { reportDesktopError } from '/@/desktop/status'
import PortalCommander from '/@/components/Commander/PortalCommander.vue'
import Provider from '/@/components/Provider.vue'

import useInit from '/@/use/init'
import { useTheme } from '/@/use/theme'
import { useAppStore } from '/@/store/appStore'

const { setTheme } = useTheme()
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
  await setTheme(settings?.general.theme || 'picportal')
  router.push('/projects')
})
</script>

<style lang="postcss">
html,
body,
#app {
  @apply w-full h-full overflow-hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  @apply bg-primary-bg text-white;
}
</style>
