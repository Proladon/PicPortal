<template>
  <router-view />
</template>

<script lang="ts" setup>
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
const router = useRouter()
onMounted(() => {
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
  @apply bg-darkBlue text-white;
}
</style>
