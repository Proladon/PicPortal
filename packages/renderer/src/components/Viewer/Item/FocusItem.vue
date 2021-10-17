<template>
  <div class="focus-item">
    <section class="viewer-container">
      <viewer
        :options="viewerOptions"
        :images="img"
        class="viewer"
        ref="viewer"
      >
        <img class="w-full" :src="`local-resource://${img}`" alt="" />
      </viewer>
    </section>
    <hr />
    <section class="info">
      path: {{ img }}
      <div class="portals" v-if="targetPortals.length">
        <div class="portal-tag-list">
          <n-tag
            class="tag"
            closable
            @close="removePortal(portal)"
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { NTag } from 'naive-ui'
import { find, map, findIndex, pull, filter } from 'lodash-es'
import { dataClone } from '/@/utils/data'

const props = defineProps({
  img: {
    type: String,
  },
})
const viewerOptions = {}

const targetPortals = ref<any>([])
const target = ref(null)
const store = useStore()
const dockings = computed(() => store.getters.dockings)
const flattenPortals = computed(() => store.getters.flattenPortals)

// => 移除圖片上的 portal
const removePortal = async (portal) => {
  const targetIndex = findIndex(
    dockings.value,
    (item) => item.target === props.img
  )
  const portalsRef = dataClone(target.value.portals)
  pull(portalsRef, portal.id)

  if (!portalsRef.length) {
    await store.dispatch('DB_SLICE', {
      key: 'dockings',
      index: targetIndex,
    })

    await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
    return
  }

  if (portalsRef.length) {
    await store.dispatch('DEEP_SAVE_TO_DB', {
      keys: `[dockings][${targetIndex}][portals]`,
      data: portalsRef,
    })

    await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  }
}

// => 同步 docking
const syncDockingsData = () => {
  const exist = find(dockings.value, { target: props.img })

  if (!exist) {
    targetPortals.value = []
    return
  }
  target.value = exist

  targetPortals.value = map(exist.portals, (portal) =>
    find(flattenPortals.value, { id: portal })
  )
}

watch(dockings, () => {
  console.log('dockings change')
  syncDockingsData()
  console.log(targetPortals.value)
})

watch(props, () => {
  console.log('props change')
  syncDockingsData()
})

onMounted(() => {
  syncDockingsData()
})
</script>

<style lang="postcss" scoped>
.focus-item {
  @apply h-full flex flex-col;
}

.viewer-container {
  @apply relative;
}
.viewer {
  @apply overflow-y-hidden  flex-1;
}

img {
  @apply w-full h-full object-contain;
}
.info {
  @apply p-5 h-1/4;
}

.portals {
  @apply top-0 left-0 w-full h-full py-2 px-3;
}

.portal-tag-list {
  @apply flex flex-wrap gap-2 opacity-70 w-full;
}
</style>
