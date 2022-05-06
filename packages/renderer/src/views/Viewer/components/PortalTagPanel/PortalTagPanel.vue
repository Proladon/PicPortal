<template>
  <div class="tree-view">
    <section class="flex flex-col min-w-[180px] full">
      <HeaderControlBlock />
      <ControlsBlock />
      <PortalGroupList />
    </section>
  </div>
</template>

<script setup lang="ts">
import HeaderControlBlock from './components/HeaderControlBlock.vue'
import PortalGroupList from './components/PortalGroupList.vue'
import ControlsBlock from './components/ControlsBlock.vue'
import { onMounted } from '@vue/runtime-core'
import { useAppStore } from '/@/store/appStore'

// ANCHOR Use
const appStore = useAppStore()

// ANCHOR Mounted
onMounted(async () => {
  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
})
</script>

<style lang="postcss" scoped>
.tree-view {
  @apply flex pt-[10px] min-w-[250px] px-[20px] h-full;
}
</style>
