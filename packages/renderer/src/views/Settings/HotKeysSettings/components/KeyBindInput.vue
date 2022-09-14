<template>
  <div>
    <n-input
      readonly
      v-model:value="syncModel"
      placeholder="press key"
      :on-focus="initEvents"
      :on-blur="destroyEvents"
    />
  </div>
</template>

<script setup lang="ts">
import { NInput } from 'naive-ui'
import { ref } from 'vue'
import { get } from 'lodash-es'
import { computed } from '@vue/reactivity'

const emit = defineEmits(['update:model'])
const props = defineProps({
  model: {
    type: String,
  },
})

const keys = ref('')
const holdingKeys = ref([])
const holdingCount = ref(0)

const syncModel = computed({
  get() {
    return props.model
  },
  set(value) {
    return emit('update:model', value)
  },
})

const keyMap = {
  Control: 'ctl',
  Escape: 'esc',
  ArrowRight: 'right',
  ArrowLeft: 'left',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

const keydownHandler = (e) => {
  if (!e.repeat) {
    let key = get(keyMap, e.key, e.key)
    if (key === 'Tab') return
    if (key === ' ') key = 'space'
    syncModel.value = ''
    holdingCount.value++
    holdingKeys.value.push(key.toUpperCase())
  }
}

const keyupHandler = (e) => {
  syncModel.value = holdingKeys.value.join('+')
  holdingCount.value--
  if (!holdingCount.value) {
    holdingKeys.value = []
    // emit('update', keys.value)
  }
}

const initEvents = (e) => {
  const target = e.target
  target.addEventListener('keydown', keydownHandler)
  target.addEventListener('keyup', keyupHandler)
}

const destroyEvents = (e) => {
  const target = e.target
  target.removeEventListener('keydown', keydownHandler)
  target.removeEventListener('keyup', keyupHandler)
}
</script>

<style scoped lang="postcss"></style>
