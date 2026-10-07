<template>
  <div class="virtual-list-item">
    <img class="item-thumb-nail" :src="toImageUrl(img)" alt="" srcset="" />
    <NIcon
      class="magnifier"
      size="20"
      @click="
        viewerApi({
          options: { navbar: false },
          images: [toImageUrl(img)]
        })
      "
    >
      <ExpandOutline
    /></NIcon>
    <div class="flex-1">
      <div class="portals" v-if="targetPortals.length">
        <div class="portal-tag-list">
          <n-tag
            class="tag"
            :closable="!appStore.readOnly"
            @close="removePortal(portal)"
            :color="{
              color: portal.bg,
              textColor: portal.fg,
              borderColor: portal.bg
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
import { sameFilePath } from '/@/utils/file'
import { toImageUrl } from '/@/desktop'
import { computed, ref } from '@vue/reactivity'
import { onMounted, watch } from '@vue/runtime-core'
import { NTag, NIcon } from 'naive-ui'
import { ExpandOutline } from '@vicons/ionicons5'
import { find, map, findIndex, pull } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { api as viewerApi } from 'v-viewer'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

const props = defineProps({
  img: {
    type: String
  }
})

const appStore = useAppStore()
const viewerStore = useViewerStore()
const portalPanelStore = usePortalPaneStore()

const targetPortals = ref<any>([])
const target = ref<Docking | null>(null)
const dockings = computed(() => viewerStore.dockings)
const flattenPortals = computed(() => portalPanelStore.flattenPortals)

// => 移除圖片上的 portal
const removePortal = async (portal: Portal) => {
  if (appStore.readOnly) return
  const targetIndex = findIndex(dockings.value, (item) =>
    sameFilePath(item.target, props.img)
  )
  const portalsRef = dataClone(target.value?.portals || [])
  pull(portalsRef, portal.id)

  if (!portalsRef.length) {
    await appStore.DBSlice({ key: 'dockings', index: targetIndex })
    await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
    return
  }

  if (portalsRef.length) {
    await appStore.DeepSaveToDB({
      key: `[dockings][${targetIndex}][portals]`,
      data: portalsRef
    })

    await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  }
}

// => 同步 docking
const syncDockingsData = () => {
  const exist = find(dockings.value, (item) =>
    sameFilePath(item.target, props.img)
  )

  if (!exist) {
    targetPortals.value = []
    return
  }
  target.value = exist

  targetPortals.value = exist.portals.flatMap((id) => {
    const portal = flattenPortals.value.find((item) => item.id === id)
    return portal ? [portal] : []
  })
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

.magnifier {
  @apply absolute bottom-0 right-0;
}
</style>
