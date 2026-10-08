<template>
  <div class="hotkeys-settings flex flex-col gap-2">
    <label class="flex items-center justify-between gap-4 text-sm">
      清除已啟用portals
      <KeyBindInput v-model:model="syncModel.clearPortals" class="w-48" />
    </label>
  </div>
</template>

<script setup lang="ts">
import KeyBindInput from './components/KeyBindInput.vue'
import { computed } from 'vue'

const emit = defineEmits(['update:model'])
const props = defineProps({
  model: {
    type: Object,
    default: () => ({}),
  },
})

const syncModel = computed({
  get() {
    return props.model
  },
  set(value) {
    return emit('update:model', value)
  },
})
</script>
