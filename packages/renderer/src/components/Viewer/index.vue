<template>
  <div class="virtual-scroll-viewer">
    <div class="list-container" v-if="pngs.length">
      <VirtualList :data="pngs" :itemSize="300" :poolBuffer="5">
        <template v-slot="{ item, index }">
          <div class="item-container">
            <img
              v-for="(img, index) in item.src"
              v-lazy="`local-resource://${img}`"
              :key="index"
              loading="lazy"
            />
          </div>
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { VirtualList } from 'vue3-virtual-list'
import { computed, ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { useElectron } from '/@/use/electron'
import { chunk } from 'lodash'
import { watch } from '@vue/runtime-core'

// --- Data ---
const { fastGlob } = useElectron()
const store = useStore()
const mainFolder = computed(() => store.getters.mainFolder)
const pngs = ref<string[]>([])

watch(mainFolder, async () => {
  const res = await fastGlob.glob(mainFolder.value.path + '/**/*.png')
  const ch = chunk(res, 3)
  const newData = ch.map((f: string) => ({ src: f }))
  pngs.value = newData
})
</script>

<style lang="postcss" scoped>
.list-container {
  @apply w-full h-[800px] m-auto;
}
.item-container {
  @apply flex gap-10 justify-center items-center;
  height: 300px;
}

img {
  @apply w-[150px] h-[150px] object-cover;
}
</style>
