<template>
  <div class="about">
    About
    <section class="logo-list">
      <img src="src/assets/vite.svg" alt="vite" />
      <img src="src/assets/vue.svg" alt="vue" />
      <img src="src/assets/typescript.svg" alt="ts" />
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'About'
})
</script>

<style scoped lang="postcss">
.about {
  @apply w-full h-full;
}
.logo-list {
  @apply flex gap-5;
  > img {
    @apply w-[30px];
  }
}
</style>
