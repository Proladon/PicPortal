<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
export default defineComponent({
  name: 'App',
  setup() {
    onMounted(() => {
      console.log('App.vue - window.ipcRenderer:', window)
    })
  }
})
</script>

<style lang="postcss">
html,
body,
#app {
  @apply h-full w-full overflow-hidden;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #20232b;
}

body {
  @apply bg-gray-800;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

.sz-btn {
  padding: 2px 10px !important;
}
</style>
