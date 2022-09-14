<template>
  <div class="hotkeys-settings">
    <n-form label-placement="left">
      <n-form-item label="清除已啟用portals">
        <KeyBindInput v-model:model="syncModel.clearPortals" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem } from 'naive-ui'
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

<style scoped lang="postcss"></style>
