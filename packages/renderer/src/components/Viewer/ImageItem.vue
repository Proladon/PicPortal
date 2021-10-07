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
  @apply h-[150px] w-[150px] object-cover rounded-md;
}
</style>
