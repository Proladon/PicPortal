<template>
  <section class="viewer-wrapper flex h-full min-w-0 flex-col">
    <ViewerHandlebar />
    <div class="min-h-0 flex-1">
      <router-view></router-view>
    </div>
  </section>
</template>

<script lang="ts" setup>
import ViewerHandlebar from './ViewerHandlebar/ViewerHandlebar.vue'
</script>
