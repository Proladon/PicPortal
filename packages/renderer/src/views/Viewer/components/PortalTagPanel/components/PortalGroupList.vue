<template>
  <n-scrollbar>
    <Draggable
      class="portal-group-list"
      v-model="portals"
      item-key="id"
      :animation="300"
    >
      <template #item="{ element }">
        <PortalGroup :groupData="element" />
      </template>
    </Draggable>
  </n-scrollbar>
</template>

<script setup lang="ts">
import Draggable from 'vuedraggable'
import PortalGroup from './PortalGroup.vue'
import { NScrollbar } from 'naive-ui/es'
import { computed } from '@vue/reactivity'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'

// ANCHOR Store
const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
// ANCHOR Computed
const portals = computed({
  get: () => portalPaneStore.portals,
  set: async (newData) => {
    const [, error] = await appStore.SaveToDB({ key: 'portals', data: newData })
    await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
    if (error) alert(error)
  }
})
</script>

<style scoped lang="postcss"></style>
