<template>
  <div class="image-item">
    <div class="portals" v-if="targetPortals.length">
      <div class="portal-tag-list">
        <NPopover v-for="portal in targetPortals" :key="portal.id">
          <template #trigger>
            <n-tag
              class="tag"
              :title="portal.name"
              closable
              @close="removePortal(portal)"
              :color="{
                color: portal.bg,
                textColor: portal.fg,
                borderColor: portal.bg
              }"
            >
              {{ portal.name }}
            </n-tag>
          </template>
          <span>{{ portal.name }}</span>
        </NPopover>
      </div>
    </div>

    <n-button
      text
      class="magnifier"
      @click="
        viewerApi({
          options: { navbar: false },
          images: [`local-resource://${img}`]
        })
      "
    >
      <NIcon size="20"><ExpandOutline /></NIcon>
    </n-button>
    <img class="!w-full" :src="`local-resource://${img}`" loading="lazy" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { NButton, NTag, NPopover, NIcon } from 'naive-ui/es'
import { ExpandOutline } from '@vicons/ionicons5'
import { find, map, findIndex, pull, filter, compact } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { api as viewerApi } from 'v-viewer'

const props = defineProps({
  img: {
    type: String
  }
})

const viewerOptions = {}

const targetPortals = ref([])
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
      index: targetIndex
    })

    await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
    return
  }

  if (portalsRef.length) {
    await store.dispatch('DEEP_SAVE_TO_DB', {
      keys: `[dockings][${targetIndex}][portals]`,
      data: portalsRef
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

  targetPortals.value = compact(
    map(exist.portals, (portal) => find(flattenPortals.value, { id: portal }))
  )
}

watch(dockings, () => {
  syncDockingsData()
})

watch(props, () => {
  syncDockingsData()
})

onMounted(() => {
  syncDockingsData()
})
</script>

<style lang="postcss" scoped>
.image-item {
  /* @apply border-2  border-teal-400 rounded-md; */
  @apply justify-self-center w-full h-full;
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

.magnifier {
  @apply absolute bottom-0 right-0;
}

.portal-tag-list {
  @apply grid grid-cols-2 gap-2 opacity-70 w-full;
}

.el {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

:deep(.n-tag span) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
