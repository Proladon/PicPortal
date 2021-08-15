<template>
  <img alt="Vue logo" src="../assets/logo.svg" width="300" />
  <app-navigation />
  <router-view />
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import AppNavigation from '/@/components/AppNavigation.vue'
export default defineComponent({
  name: 'App',
  components: {
    AppNavigation
  },

  setup() {
    onMounted(async () => {
      await window.electron.userStore.set('test', 'test')
      console.log(await window.electron.userStore.get('test'))
      await window.electron.userStore.clear()
      console.log(await window.electron.userStore.get('test'))
    })
  }
})
</script>

<style lang="postcss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  @apply bg-gray-800 text-white;
}
</style>
