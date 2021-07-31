<template>
  <footer class="status-bar">
    <trash-icon />
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'StatusBar'
})
</script>

<style lang="postcss" scoped>
footer {
  height: 30px;
  @apply flex items-center;
  @apply bg-border;
}
</style>
