<template>
  <div class="image-item">
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
    <img :src="`local-resource://${img}`" loading="lazy" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { NTag } from 'naive-ui'
import { find, map, findIndex, pull, filter } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import prettLlogger from '/@/utils/logger'
import { Logger } from '../../../types/logger'
const logger: Logger = prettLlogger

const props = defineProps({
  img: {
    type: String,
  },
})

const targetPortals = ref<any>([])
const target = ref(null)
const store = useStore()
const dockings = computed(() => store.getters.dockings)
const flattenPortals = computed(() => store.getters.flattenPortals)

// => 移除圖片上的 portal
const removePortal = async (portal) => {
  logger.danger('portal', portal)
  logger.action('remove potals triggerd')

  const targetIndex = findIndex(
    dockings.value,
    (item) => item.target === props.img
  )
  const portalsRef = dataClone(target.value.portals)
  logger.noLabel('portal.id', portal.id)
  pull(portalsRef, portal.id)
  logger.todo(portalsRef)

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

  logger.noLabel('exist.portals', exist.portals)

  targetPortals.value = map(exist.portals, (portal) =>
    find(flattenPortals.value, { id: portal })
  )
}

watch(dockings, () => {
  syncDockingsData()
})

watch(props, () => {
  syncDockingsData()
})

onMounted(() => {
  logger.action('exist.portals', flattenPortals.value)
  syncDockingsData()
})
</script>

<style lang="postcss" scoped>
.image-item {
  /* @apply border-2  border-teal-400 rounded-md; */
  @apply justify-self-center;
  @apply relative cursor-pointer border-solid border-2 rounded-md border-transparent;
  @apply hover:border-[var(--skyblue)] hover:shadow-blue-gray-50;
  &:hover {
    box-shadow: 1px 2px 20px 6px rgba(255, 255, 255, 0.29);
    -webkit-box-shadow: 1px 2px 20px 6px rgba(255, 255, 255, 0.29);
    -moz-box-shadow: 1px 2px 20px 6px rgba(255, 255, 255, 0.29);
  }
}
img {
  @apply h-[150px] w-[150px] object-cover rounded-md;
}

.portals {
  @apply absolute top-0 left-0 w-full h-full py-2 px-3;
  @apply bg-opacity-50 bg-gray-800;
}

.portal-tag-list {
  @apply grid grid-cols-2 gap-2 opacity-70 w-full;
}
</style>
