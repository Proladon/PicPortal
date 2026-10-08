<template>
  <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
    <Draggable
      v-if="portals.length"
      class="portal-group-list flex flex-col gap-0.5"
      v-model="portals"
      item-key="id"
      :animation="300"
      :force-fallback="true"
      :fallback-on-body="true"
      :support-pointer="false"
      handle=".group-header"
      :disabled="appStore.readOnly"
    >
      <template #item="{ element }">
        <PortalGroup :groupData="element" />
      </template>
    </Draggable>

    <p
      v-if="portals.length && noMatch"
      class="px-2 py-6 text-center text-sm text-muted-foreground"
    >
      {{ t('portalPane.empty.noMatch') }}
    </p>

    <Empty v-if="!portals.length" class="h-full p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Waypoints />
        </EmptyMedia>
        <EmptyTitle>{{ t('portalPane.empty.title') }}</EmptyTitle>
        <EmptyDescription>{{
          t('portalPane.empty.description')
        }}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent v-if="!appStore.readOnly">
        <Button
          size="sm"
          variant="outline"
          @click="showPortalGroupModal = true"
        >
          <FolderPlus />
          {{ t('portalPane.controls.newGroup') }}
        </Button>
      </EmptyContent>
    </Empty>
  </div>

  <PortalGroupModal
    v-if="showPortalGroupModal"
    mode="create"
    @close="showPortalGroupModal = false"
  />
</template>

<script setup lang="ts">
import Draggable from 'vuedraggable'
import PortalGroup from './PortalGroup.vue'
import PortalGroupModal from './Modal/PortalGroupModal.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderPlus, Waypoints } from '@lucide/vue'
import { Button } from '/@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '/@/components/ui/empty'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

// ANCHOR Store
const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
const showPortalGroupModal = ref(false)
// ANCHOR Computed
const portals = computed({
  get: () => portalPaneStore.portals,
  set: async (newData) => {
    const [, error] = await appStore.SaveToDB({ key: 'portals', data: newData })
    await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
    if (error) alert(error)
  },
})
const noMatch = computed(() => {
  const search = portalPaneStore.searchPortalName
  if (!search) return false
  return !portalPaneStore.flattenPortals.some((portal) =>
    portal.name.includes(search)
  )
})
</script>
