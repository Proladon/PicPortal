<template>
  <div
    class="image-item group relative size-[150px] cursor-pointer justify-self-center overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5 transition-shadow hover:ring-2 hover:ring-primary/70"
    :class="{ 'ring-2 !ring-primary': targetPortals.length }"
    @contextmenu.prevent="openViewer(img)"
  >
    <img
      class="size-full object-cover"
      :src="toImageUrl(img)"
      loading="lazy"
      draggable="false"
    />
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
  </div>
</template>

<script setup lang="ts">
import PortalBadge from '/@/components/PortalBadge.vue'
import { toImageUrl } from '/@/desktop'
import { openViewer } from '/@/utils/image'
import { useAppStore } from '/@/store/appStore'
import { useDockedPortals } from '/@/use/dockedPortals'

const props = defineProps({
  img: {
    type: String,
  },
})

const appStore = useAppStore()
const { targetPortals, removePortal } = useDockedPortals(() => props.img)
</script>
