<template>
  <div>
    <n-input
      readonly
      v-model:value="keys"
      placeholder="press key"
      :on-focus="initEvents"
      :on-blur="destroyEvents"
    />
  </div>
</template>

<script setup lang="ts">
import { NInput } from 'naive-ui'
import { ref } from 'vue'

const keys = ref('')
const holdingKeys = ref([])

const keydownHandler = (e) => {
  if (!e.repeat) {
    keys.value = ''
    keys.value = e.key
    holdingKeys.value.push(e.key)
    console.log(`${e.key} [event: keydown]`)
  }
}

const keyupHandler = (e) => {
  console.log(`${e.key} [event: keyup]`)
  keys.value = holdingKeys.value.join('+')
  holdingKeys.value = []
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
