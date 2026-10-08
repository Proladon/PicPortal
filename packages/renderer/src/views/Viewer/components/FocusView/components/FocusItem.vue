<template>
  <div class="focus-item">
    <section class="viewer-container">
      <viewer
        :options="viewerOptions"
        :images="[toImageUrl(img)]"
        class="viewer"
        ref="viewer"
      >
        <img class="w-full" :src="toImageUrl(img)" alt="" />
      </viewer>
    </section>
    <hr />
    <section class="info">
      path: {{ img }}
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { sameFilePath } from '/@/utils/file'
import { toImageUrl } from '/@/desktop'
import { computed, ref } from 'vue'
import { onMounted, watch } from 'vue'
import { NTag } from 'naive-ui'
import { find, map, findIndex, pull } from 'lodash-es'
import { dataClone } from '/@/utils/data'
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
const portalPaneStore = usePortalPaneStore()
const viewerOptions = {}

const targetPortals = ref<any>([])
const target = ref<any>(null)
const dockings = computed(() => viewerStore.dockings)
const flattenPortals = computed(() => portalPaneStore.flattenPortals)

// => 移除圖片上的 portal
const removePortal = async (portal: any) => {
  if (appStore.readOnly) return
  const targetIndex = findIndex(dockings.value, (item: any) =>
    sameFilePath(item.target, props.img)
  )
  const portalsRef: any = dataClone(target.value?.portals || [])
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
