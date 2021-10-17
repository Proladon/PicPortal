<template>
  <section class="viewer">
    <HandleBar />
    <router-view></router-view>
  </section>
</template>

<script lang="ts" setup>
import HandleBar from '/@/components/Viewer/Handlebar.vue'
</script>
