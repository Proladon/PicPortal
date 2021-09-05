<template>
  <div class="image-item">
    <img :src="`local-resource://${img}`" loading="lazy" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  img: {
    type: String,
  },
})
</script>

<style lang="postcss" scoped>
.image-item {
  /* @apply border-2  border-teal-400 rounded-md; */
}
img {
  @apply w-[150px] h-[150px] object-cover rounded-md;
}
</style>
