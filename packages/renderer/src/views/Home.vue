<template>
  <div class="home">
    <keep-alive>
      <Viewer />
    </keep-alive>
    <Project />
  </div>
</template>

<script setup lang="ts">
import Viewer from '/@/components/Viewer/index.vue'
import Project from './Projects.vue'
</script>

<style scoped lang="postcss">
.home {
  @apply w-full h-full;
}
</style>
