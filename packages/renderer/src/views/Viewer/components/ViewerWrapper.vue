<template>
  <section class="viewer-wrapper">
    <HandleBar />
    <router-view class="flex-1"></router-view>
  </section>
</template>

<script lang="ts" setup>
import HandleBar from './Handlebar.vue'
</script>

<style lang="postcss" scoped>
.viewer-wrapper {
  @apply h-full px-[15px] flex flex-col;
}
</style>
