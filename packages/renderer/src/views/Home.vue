<template>
  <div class="home">
    Home
    <div>Hello World</div>
    <br />
    {{ pngs }}
    <img v-for="img in pngs" :src="`local-resource://${img}`" :key="img" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useElectron } from '../use/electron'
export default defineComponent({
  name: 'Home',
  setup() {
    const { fastGlob } = useElectron()
    const store = useStore()
    const mainFolder = computed(() => store.getters.mainFolder)
    const pngs = ref<string[]>([])

    watch(mainFolder, async () => {
      console.log(mainFolder.value.path + '/**/*.png')
      const res = await fastGlob.glob(mainFolder.value.path + '/**/*.png')
      console.log(res)
      pngs.value = res.splice(0, 6)
    })
    return { pngs, mainFolder }
  }
})
</script>

<style scoped lang="postcss"></style>
