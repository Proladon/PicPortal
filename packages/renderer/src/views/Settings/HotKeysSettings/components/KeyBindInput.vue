<template>
  <Input
    readonly
    :model-value="syncModel"
    placeholder="press key"
    class="font-mono text-xs"
    @focus="initEvents"
    @blur="destroyEvents"
  />
</template>

<script setup lang="ts">
import { Input } from '/@/components/ui/input'
import { ref } from 'vue'
import { get } from 'lodash-es'
import { computed } from 'vue'

const emit = defineEmits(['update:model'])
const props = defineProps({
  model: {
    type: String,
  },
})

const keys = ref('')
const holdingKeys = ref<string[]>([])
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

const keydownHandler = (e: KeyboardEvent) => {
  if (!e.repeat) {
    let key = get(keyMap, e.key, e.key)
    if (key === 'Tab') return
    if (key === ' ') key = 'space'
    syncModel.value = ''
    holdingCount.value++
    holdingKeys.value.push(key.toUpperCase())
  }
}

const keyupHandler = (e: KeyboardEvent) => {
  syncModel.value = holdingKeys.value.join('+')
  holdingCount.value--
  if (!holdingCount.value) {
    holdingKeys.value = []
    // emit('update', keys.value)
  }
}

const initEvents = (e: FocusEvent) => {
  const target = e.target as HTMLInputElement
  target.addEventListener('keydown', keydownHandler)
  target.addEventListener('keyup', keyupHandler)
}

const destroyEvents = (e: FocusEvent) => {
  const target = e.target as HTMLInputElement
  target.removeEventListener('keydown', keydownHandler)
  target.removeEventListener('keyup', keyupHandler)
}
</script>
