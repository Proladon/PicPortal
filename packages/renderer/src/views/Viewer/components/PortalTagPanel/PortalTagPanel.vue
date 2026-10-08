<template>
  <aside
    class="tree-view portal-panel flex h-full min-w-0 flex-col bg-sidebar/60"
  >
    <HeaderControlBlock />
    <ControlsBlock />
    <PortalGroupList />
  </aside>
</template>

<script setup lang="ts">
import HeaderControlBlock from './components/HeaderControlBlock.vue'
import PortalGroupList from './components/PortalGroupList.vue'
import ControlsBlock from './components/ControlsBlock.vue'
import { onMounted } from 'vue'
import { useAppStore } from '/@/store/appStore'

// ANCHOR Use
const appStore = useAppStore()

// ANCHOR Mounted
onMounted(async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
})
</script>
