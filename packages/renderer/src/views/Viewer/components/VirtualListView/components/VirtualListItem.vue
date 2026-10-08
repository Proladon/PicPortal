<template>
  <div
    class="virtual-list-item group flex h-full w-full cursor-pointer items-stretch gap-4 rounded-lg border bg-card p-2.5 transition-colors hover:border-primary/60"
    :class="{ 'border-primary/70 bg-primary/5': targetPortals.length }"
    @contextmenu.prevent="openViewer(img)"
  >
    <img
      class="item-thumb-nail aspect-[4/3] h-full shrink-0 rounded-md bg-muted object-cover"
      :src="toImageUrl(img)"
      loading="lazy"
      draggable="false"
      alt=""
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
      <p class="truncate text-sm font-medium">{{ fileName }}</p>
      <p
        class="truncate font-mono text-[11px] text-muted-foreground"
        :title="img"
      >
        {{ img }}
      </p>
      <div v-if="targetPortals.length" class="portals mt-auto">
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
    <Button
      class="magnifier self-start opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      size="icon-sm"
      variant="ghost"
      :aria-label="t('viewer.item.preview')"
      @click.stop="openViewer(img)"
    >
      <Expand />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Expand } from '@lucide/vue'
import PortalBadge from '/@/components/PortalBadge.vue'
import { Button } from '/@/components/ui/button'
import { toImageUrl } from '/@/desktop'
import { openViewer } from '/@/utils/image'
import { getFileName, getFileExt } from '/@/utils/file'
import { useAppStore } from '/@/store/appStore'
import { useDockedPortals } from '/@/use/dockedPortals'

const props = defineProps({
  img: {
    type: String,
  },
})

const { t } = useI18n()
const appStore = useAppStore()
const { targetPortals, removePortal } = useDockedPortals(() => props.img)
const fileName = computed(
  () => `${getFileName(props.img || '')}${getFileExt(props.img || '')}`
)
</script>
