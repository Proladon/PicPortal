<template>
  <CommandDialog
    :open="showModal"
    :title="t('portalPane.commander.title')"
    :description="t('portalPane.commander.placeholder')"
    class="portal-commander sm:max-w-lg"
    @update:open="updateModalShow"
  >
    <CommandInput :placeholder="t('portalPane.commander.placeholder')" />
    <CommandList class="max-h-80">
      <CommandEmpty>{{ t('portalPane.commander.empty') }}</CommandEmpty>
      <CommandGroup
        v-for="group in portalGroups"
        :key="group.id"
        :heading="group.group"
      >
        <CommandItem
          v-for="portal in group.childs"
          :key="portal.id"
          class="portal-option"
          :value="portal.id"
          :data-checked="isActive(portal.id)"
          @select.prevent="onSelect(portal.id, group.id)"
        >
          <span
            class="size-2.5 shrink-0 rounded-full border border-foreground/15"
            :style="{ background: portal.bg || 'var(--muted)' }"
          />
          <span class="min-w-0 flex-1 truncate">{{ portal.name }}</span>
          <span
            class="max-w-[45%] truncate pl-4 font-mono text-[11px] text-muted-foreground"
          >
            {{ portal.link }}
          </span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
    <div
      class="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground"
    >
      <span class="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd></span>
      <span class="flex items-center gap-1"><Kbd>Enter</Kbd></span>
      <span class="ml-auto flex items-center gap-1"><Kbd>Esc</Kbd></span>
    </div>
  </CommandDialog>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '/@/components/ui/command'
import { Kbd } from '/@/components/ui/kbd'
import { useModal } from '/@/use/modal'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

const emit = defineEmits(['close', 'confirm'])
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
const { updateModalShow, showModal } = useModal(emit)

const portalGroups = computed(() =>
  portalPaneStore.portals.filter((group) => group.childs.length)
)

const isActive = (id: string) =>
  portalPaneStore.activePortals.some((portal) => portal.id === id)

const onSelect = (id: string, group: string) => {
  if (!isActive(id)) portalPaneStore.AddActivedPortal({ id, group })
  updateModalShow(false)
}

onMounted(() => {
  updateModalShow(true)
})
</script>
