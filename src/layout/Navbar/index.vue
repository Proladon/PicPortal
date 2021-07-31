<template>
  <div class="navbar">
    <router-link to="/">
      <home-icon class="nav-btn" />
    </router-link>
    <router-link to="/about">
      <settings-icon class="nav-btn" />
    </router-link>
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
