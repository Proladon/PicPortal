<template>
  <Provider>
    <router-view />
  </Provider>
</template>

<script lang="ts" setup>
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import Provider from '/@/components/Provider.vue'
import useInit from '/@/use/init'

const router = useRouter()
const { init } = useInit()

onMounted(async () => {
  await init()
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
