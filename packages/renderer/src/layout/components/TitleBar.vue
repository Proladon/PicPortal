<template>
  <header class="title-bar" style="-webkit-app-region: drag">
    <section class="app-logo"></section>
    <section class="app-name">PicPortal</section>
    <section class="flex gap-[20px] justify-end">
      <div class="win-btn min"></div>
      <div class="win-btn max"></div>
      <div class="win-btn close"></div>
    </section>
  </header>
</template>

<script setup></script>

<style lang="postcss" scoped>
.title-bar {
  @apply grid grid-cols-3 px-2 py-2;
}

.app-logo {
  @apply text-left;
}

.app-name {
  @apply text-[var(--primary-font)] font-bold;
}

.min,
.max,
.close {
  @apply w-[20px] h-[20px] rounded-full;
}

.win-btn {
  @apply border-2 border-solid cursor-pointer;
  -webkit-app-region: no-drag;
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
