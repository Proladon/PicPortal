<template>
  <div class="navbar">
    <router-link to="/"> Home </router-link>
    <router-link to="/about"> About </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'Navbar'
})
</script>

<style lang="postcss" scoped>
.navbar {
  width: 50px;
  @apply flex flex-col flex-shrink-0 items-center py-2;
  @apply bg-gray-600;
}
.nav-btn {
  @apply text-gray-300 my-2 w-full;
}
</style>
