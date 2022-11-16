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
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import PortalCommander from './components/Commander/PortalCommander.vue'
import { useAppStore } from './store/appStore'
import { useElectron } from './use/electron'
import Provider from '/@/components/Provider.vue'
import useInit from '/@/use/init'
import { useTheme } from '/@/use/theme'

const { userStore } = useElectron()

const { setTheme } = useTheme()
const router = useRouter()
const appStore = useAppStore()
const { init } = useInit()

onMounted(async () => {
  await init()

  const settings = await userStore.get('settings')
  setTheme(settings.general.theme)
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
