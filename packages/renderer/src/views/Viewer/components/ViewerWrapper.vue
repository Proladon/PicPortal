<template>
  <section class="viewer-wrapper">
    <ViewerHandlebar />
    <router-view></router-view>
  </section>
</template>

<script lang="ts" setup>
import ViewerHandlebar from './ViewerHandlebar/ViewerHandlebar.vue'
</script>

<style lang="postcss" scoped>
.viewer-wrapper {
  @apply h-full px-[15px] flex flex-col;
}
</style>
