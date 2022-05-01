<template>
  <n-dropdown trigger="click" :options="options" @select="handleSelect">
    <n-button class="h-[32px]" ghost>
      <n-icon size="20"><Flash /></n-icon>
    </n-button>
  </n-dropdown>

  <WarningModal
    v-if="showWarning"
    :keyRef="selectedKey"
    :content="modalContent"
    @close="showWarning = false"
    @confirm="handleWarningConfirm"
  />
</template>

<script setup lang="ts">
import { NButton, NIcon, NDropdown, useNotification } from 'naive-ui/es'
import { Flash } from '@vicons/ionicons5'
import { useViewerStore } from '/@/store/viewerStore'
import { computed, ref } from '@vue/reactivity'
import WarningModal from './modal/WarningModal.vue'

const viewerStore = useViewerStore()
const notify = useNotification()
const selectedKey = ref('')
const modalContent = ref('')
const showWarning = ref(false)

const options = computed(() => [
  {
    label: 'Clear all dockings',
    key: 'clear dockings',
    disabled: viewerStore.dockings.length ? false : true
  }
  // {
  //   label: 'Clear Portals',
  //   key: 'the beverly hills hotel, los angeles'
  // }
])

const handleSelect = (key: string) => {
  if (key === 'clear dockings') {
    selectedKey.value = key
    modalContent.value = 'Are you sure to clear all dockings?'
    showWarning.value = true
  }
}

const handleWarningConfirm = (key: string) => {
  if (key === 'clear dockings') {
    clearDockings()
    notify.success({ content: 'All dockings cleared', duration: 2000 })
  }
}

const clearDockings = async () => {
  await viewerStore.ClearDockings()
}
</script>

<style lang="postcss" scoped></style>
