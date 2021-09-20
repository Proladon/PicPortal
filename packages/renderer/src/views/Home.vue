<template>
  <div class="home">
    <keep-alive>
      <Viewer />
    </keep-alive>
  </div>
</template>

<script setup lang="ts">
import Viewer from '/@/components/Viewer/index.vue'
</script>

<style scoped lang="postcss">
.home {
  @apply w-full h-full;
}
</style>
