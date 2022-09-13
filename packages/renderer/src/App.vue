<template>
  <Provider>
    <router-view />
  </Provider>
</template>

<script lang="ts" setup>
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import Provider from '/@/components/Provider.vue'
import { useElectron } from '/@/use/electron'
import useLocale from '/@/use/locale'
const { userStore } = useElectron()

const router = useRouter()
const { changeLocale } = useLocale()

onMounted(async () => {
  const settings = await userStore.get('settings')
  if (settings) changeLocale(settings.general.locale)
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
