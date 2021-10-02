<template>
  <header class="title-bar" style="-webkit-app-region: drag">
    <section></section>
    <section class="app-name">Picnel.io</section>
    <section class="flex gap-[10px] justify-end">
      <div class="min"></div>
      <div class="max"></div>
      <div class="close"></div>
    </section>
  </header>
</template>

<script setup></script>

<style lang="postcss" scoped>
.title-bar {
  @apply grid grid-cols-3 px-2 py-1;
}

.app-name {
  @apply text-stroke-cyan-300;
}

.min,
.max,
.close {
  @apply w-[20px] h-[20px] rounded-full cursor-pointer;
}

.min {
  @apply bg-border;
}
.max {
  @apply bg-border;
}
.close {
  @apply bg-border;
}
</style>
