<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="view-filter gap-1.5"
        :class="{
          'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary':
            activeCount,
        }"
      >
        <ListFilter />
        {{ t('viewer.toolbar.filter') }}
        <Badge
          v-if="activeCount"
          class="h-4 min-w-4 px-1 text-[10px] tabular-nums"
        >
          {{ activeCount }}
        </Badge>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-80 gap-0 p-0">
      <div class="flex items-center justify-between border-b px-3 py-2.5">
        <p class="text-sm font-medium">{{ t('viewer.viewerFilter.title') }}</p>
        <Button
          variant="ghost"
          size="xs"
          :disabled="!activeCount"
          @click="resetFilter"
        >
          {{ t('viewer.viewerFilter.reset') }}
        </Button>
      </div>

      <div class="flex flex-col gap-4 p-3">
        <label class="flex items-center justify-between gap-3 text-sm">
          {{ t('viewer.viewerFilter.onlyDockings') }}
          <Switch v-model="onlyDockings" />
        </label>

        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t('viewer.viewerFilter.fileTypes') }}
          </p>
          <ToggleGroup
            v-model="selectedFileTypes"
            type="multiple"
            variant="outline"
            size="sm"
            class="w-full"
          >
            <ToggleGroupItem
              v-for="type in availableFileTypes"
              :key="type"
              :value="type"
              class="flex-1 font-mono text-xs"
            >
              {{ type }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div class="flex flex-col gap-2">
          <p
            class="flex items-center justify-between text-xs font-medium text-muted-foreground"
          >
            {{ t('viewer.viewerFilter.portals') }}
            <span v-if="selectedPortals.length" class="tabular-nums">
              {{ selectedPortals.length }}
            </span>
          </p>
          <Command class="rounded-lg! border p-0">
            <CommandInput
              :placeholder="t('viewer.viewerFilter.filterPortals.placeholder')"
            />
            <CommandList class="max-h-52">
              <CommandEmpty>{{
                t('viewer.viewerFilter.filterPortals.empty')
              }}</CommandEmpty>
              <CommandGroup
                v-for="group in portalGroups"
                :key="group.id"
                :heading="group.group"
              >
                <CommandItem
                  v-for="portal in group.childs"
                  :key="portal.id"
                  :value="portal.id"
                  :data-checked="selectedPortals.includes(portal.id)"
                  @select.prevent="togglePortal(portal.id)"
                >
                  <span
                    class="size-2.5 shrink-0 rounded-full border border-foreground/15"
                    :style="{ background: portal.bg || 'var(--muted)' }"
                  />
                  <span class="truncate">{{ portal.name }}</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ListFilter } from '@lucide/vue'
import { Badge } from '/@/components/ui/badge'
import { Button } from '/@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '/@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '/@/components/ui/popover'
import { Switch } from '/@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '/@/components/ui/toggle-group'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useViewerStore } from '/@/store/viewerStore'

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()

const onlyDockings = computed({
  get() {
    return viewerStore.filter.onlyDockings
  },
  set(show: boolean) {
    if (!show) viewerStore.filter.portals = []
    viewerStore.filter.onlyDockings = show
  },
})
const selectedPortals = computed({
  get() {
    return viewerStore.filter.portals
  },
  set(data: string[]) {
    if (data.length) viewerStore.filter.onlyDockings = true
    else if (!data.length) viewerStore.filter.onlyDockings = false
    viewerStore.filter.portals = data
  },
})

const selectedFileTypes = computed({
  get() {
    return viewerStore.filter.fileTypes
  },
  set(data: unknown) {
    viewerStore.filter.fileTypes = Array.isArray(data) ? data : []
  },
})

const activeCount = computed(
  () =>
    Number(viewerStore.filter.onlyDockings) +
    viewerStore.filter.portals.length +
    viewerStore.filter.fileTypes.length
)

const portalGroups = computed(() =>
  portalPaneStore.portals.filter((group) => group.childs.length)
)
const availableFileTypes = ['png', 'jpg', 'jpeg', 'webp', 'gif']

const togglePortal = (id: string) => {
  const current = selectedPortals.value
  selectedPortals.value = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
}

const resetFilter = () => {
  viewerStore.filter.portals = []
  viewerStore.filter.fileTypes = []
  viewerStore.filter.onlyDockings = false
}
</script>
