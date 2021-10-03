<template>
  <header class="title-bar" style="-webkit-app-region: drag">
    <section></section>
    <section class="app-name">Picnel.io</section>
    <section class="flex gap-[10px] justify-end">
      <div class="win-btn min"></div>
      <div class="win-btn max"></div>
      <div class="win-btn close"></div>
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

.win-btn {
  @apply border-2 border-solid;
}

.min {
  @apply border-[#649FA0];
}
.max {
  @apply border-[#E2A739];
}
.close {
  @apply border-[#D44172];
}
</style>
