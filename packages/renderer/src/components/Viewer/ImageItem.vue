<template>
  <div class="image-item">
    <img :src="`local-resource://${img}`" loading="lazy" />

    <div class="portals" v-if="targetPortals.length">
      <div class="flex flex-wrap gap-2">
        <n-tag
          closable
          :color="{
            color: portal.bg,
            textColor: portal.fg,
            borderColor: portal.bg,
          }"
          v-for="portal in targetPortals"
          :key="portal.id"
        >
          {{ portal.name }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { NTag } from 'naive-ui'
import { find, map, chain, flatten } from 'lodash-es'

const props = defineProps({
  img: {
    type: String,
  },
})
const targetPortals = ref([])

const store = useStore()
const docking = computed(() => store.getters.docking)
const flattenPortals = computed(() => store.getters.flattenPortals)

watch(docking, () => {
  console.log('change')
  const exist = find(docking.value, { target: props.img })
  if (!exist) return
  targetPortals.value = map(exist.portals, (portal) =>
    find(flattenPortals.value, { id: portal })
  )
})

onMounted(() => {
  const exist = find(docking.value, { target: props.img })
  if (!exist) return
  targetPortals.value = map(exist.portals, (portal) =>
    find(flattenPortals.value, { id: portal })
  )
})
</script>

<style lang="postcss" scoped>
.image-item {
  /* @apply border-2  border-teal-400 rounded-md; */
  @apply relative;
}
img {
  @apply h-[150px] w-[150px] object-cover rounded-md;
}

.portals {
  @apply absolute top-0 left-0 w-full h-full py-2 px-3;
  @apply bg-opacity-70 bg-gray-800;
}
</style>
