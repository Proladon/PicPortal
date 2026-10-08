<template>
  <div
    class="image-item group relative cursor-pointer overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5 transition-shadow hover:ring-2 hover:ring-primary/70"
    :class="{ 'ring-2 !ring-primary': targetPortals.length }"
    :style="{ height: `${imgSize}px` }"
    @contextmenu.prevent="openViewer(img)"
  >
    <img
      class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      :src="toImageUrl(img)"
      loading="lazy"
      draggable="false"
    />

    <div
      class="pointer-events-none absolute inset-x-0 top-0 truncate bg-gradient-to-b from-black/60 to-transparent px-2 pt-1.5 pb-4 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      {{ fileName }}
    </div>

    <div
      v-if="targetPortals.length"
      class="portals absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-1.5 pt-6"
    >
      <div class="portal-tag-list flex flex-wrap gap-1">
        <PortalBadge
          v-for="portal in targetPortals"
          :key="portal.id"
          :portal="portal"
          :closable="!appStore.readOnly"
          @close="removePortal(portal)"
        />
      </div>
    </div>

    <Button
      class="magnifier absolute top-1.5 right-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      size="icon-xs"
      variant="secondary"
      :aria-label="t('viewer.item.preview')"
      @click.stop="openViewer(img)"
    >
      <Expand />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Expand } from '@lucide/vue'
import PortalBadge from '/@/components/PortalBadge.vue'
import { Button } from '/@/components/ui/button'
import { toImageUrl } from '/@/desktop'
import { openViewer } from '/@/utils/image'
import { getFileName, getFileExt } from '/@/utils/file'
import { useAppStore } from '/@/store/appStore'
import { useViewerStore } from '/@/store/viewerStore'
import { useDockedPortals } from '/@/use/dockedPortals'

const props = defineProps({
  img: {
    type: String,
  },
})

const { t } = useI18n()
const appStore = useAppStore()
const viewerStore = useViewerStore()
const { targetPortals, removePortal } = useDockedPortals(() => props.img)

const imgSize = computed(() => viewerStore.gridView.imgSize)
const fileName = computed(
  () => `${getFileName(props.img || '')}${getFileExt(props.img || '')}`
)
</script>
