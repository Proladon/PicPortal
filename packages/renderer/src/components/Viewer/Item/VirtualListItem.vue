<template>
  <div class="virtual-list-item">
    <img
      class="item-thumb-nail"
      :src="`local-resource://${img}`"
      alt=""
      srcset=""
    />
    <div class="flex-1">
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
    </div>
  </div>
</template>

<script lang="ts" setup>
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
.virtual-list-item {
  @apply flex w-full h-full py-5;
  @apply relative cursor-pointer border-solid border-2 rounded-md border-transparent;
  @apply hover:border-[var(--skyblue)];
}

.item-thumb-nail {
  @apply min-w-[100px] max-w-[190px] h-full object-cover;
}

.portals {
  @apply w-full h-full px-3;
}

.portal-tag-list {
  @apply flex gap-2 opacity-70 w-full;
}
</style>
