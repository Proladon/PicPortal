<template>
  <n-dropdown trigger="click" :options="options()" @select="handleSelect">
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
import { NButton, NIcon, NDropdown, useNotification } from 'naive-ui'
import { Flash } from '@vicons/ionicons5'
import { useViewerStore } from '/@/store/viewerStore'
import { computed, ref } from '@vue/reactivity'
import WarningModal from './modal/WarningModal.vue'
import useLocale from '/@/use/locale'
import { h } from 'vue'

const viewerStore = useViewerStore()
const notify = useNotification()
const { translate } = useLocale()

const selectedKey = ref('')
const modalContent = ref('')
const showWarning = ref(false)

const options = () => [
  {
    label: translate('viewer.quickActions.clearDockings.label'),
    key: 'clear dockings',
    icon: () => h(NIcon, { size: '14' }, { default: () => h(Flash) }),
    disabled: viewerStore.dockings.length ? false : true,
  },
  // {
  //   label: 'Replace Portals',
  //   key: 'Replace specify portals',
  //   icon: () => h(NIcon, { size: '14' }, { default: () => h(Flash) }),
  //   disabled: viewerStore.dockings.length ? false : true
  // }
]

const handleSelect = (key: string) => {
  if (key === 'clear dockings') {
    selectedKey.value = key
    modalContent.value = translate('viewer.quickActions.clearDockings.warning')
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
