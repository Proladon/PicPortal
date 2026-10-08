<template>
  <section class="flex flex-col gap-1">
    <h2 class="text-base font-semibold tracking-tight">{{ title }}</h2>
    <div class="mt-3 divide-y rounded-xl border bg-card">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps({ title: { type: String, required: true } })
</script>
