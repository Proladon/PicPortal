<template>
  <div class="focus-item flex h-full min-h-0 flex-col gap-3">
    <section
      class="focus-stage relative min-h-0 flex-1 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-foreground/5"
    >
      <viewer
        :options="viewerOptions"
        :images="[toImageUrl(img)]"
        class="viewer size-full"
      >
        <img
          class="size-full cursor-zoom-in object-contain"
          :src="toImageUrl(img)"
          alt=""
        />
      </viewer>
    </section>
    <section
      class="info flex shrink-0 items-start gap-4 rounded-xl border bg-card p-3"
    >
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ fileName }}</p>
        <p class="mt-0.5 font-mono text-[11px] break-all text-muted-foreground">
          {{ img }}
        </p>
      </div>
      <div class="portals flex max-w-[50%] flex-wrap justify-end gap-1.5">
        <template v-if="targetPortals.length">
          <PortalBadge
            v-for="portal in targetPortals"
            :key="portal.id"
            :portal="portal"
            :closable="!appStore.readOnly"
            @close="removePortal(portal)"
          />
        </template>
        <span v-else class="text-xs text-muted-foreground">
          {{ t('viewer.focus.noPortals') }}
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PortalBadge from '/@/components/PortalBadge.vue'
import { toImageUrl } from '/@/desktop'
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
const viewerOptions = {}
const { targetPortals, removePortal } = useDockedPortals(() => props.img)
const fileName = computed(
  () => `${getFileName(props.img || '')}${getFileExt(props.img || '')}`
)
</script>
