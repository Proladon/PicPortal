<template>
  <div class="home">
    Home
    <div :class="theme">Hello World</div>
    <br />
    <input class="text-gray-800" type="text" v-model="color" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'Home',
  setup() {
    const color = ref('#FFFFFF')
    const theme = computed(() => {
      return `bg-[${color.value}]`
    })
    return { theme, color }
  }
})
</script>

<style scoped lang="postcss"></style>
