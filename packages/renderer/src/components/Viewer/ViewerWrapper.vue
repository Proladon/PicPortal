<template>
  <section class="viewer">
    <HandleBar />
    <router-view class="flex-1"></router-view>
  </section>
</template>

<script lang="ts" setup>
import HandleBar from '/@/components/Viewer/Handlebar.vue'
</script>

<style lang="postcss" scoped>
.viewer {
  @apply h-full;
}
</style>
