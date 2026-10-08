<template>
  <div
    class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5"
  >
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium">{{ label }}</p>
      <p v-if="description" class="mt-0.5 text-xs text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div class="shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
