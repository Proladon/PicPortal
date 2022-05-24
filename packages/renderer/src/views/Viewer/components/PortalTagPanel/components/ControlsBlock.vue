<template>
  <div class="controls-block">
    <div class="flex items-center flex-wrap gap-2">
      <span>{{ translate('portalPane.mode.label') }}：</span>
      <n-radio-group
        v-model:value="dockingMode"
        :on-update:value="changeDockingMode"
      >
        <n-radio-button value="append">
          <n-icon><Layers /></n-icon>
        </n-radio-button>
        <n-radio-button value="override">
          <n-icon><CopySharp /></n-icon>
        </n-radio-button>
      </n-radio-group>
    </div>
    <div class="activated-count">
      <div class="flex gap-5 flex-wrap items-center">
        <NBadge
          :color="portalsCountBadgeBg"
          show-zero
          :value="activatedPortalsCount"
        ></NBadge>
        Portals
      </div>
      <NButton
        size="small"
        :disabled="!activatedPortalsCount"
        @click="resetAvtivatedPortals"
      >
        {{ translate('portalPane.controls.clear') }}
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from '@vue/reactivity'
import { NIcon, NButton, NBadge, NRadioGroup, NRadioButton } from 'naive-ui'
import { Layers, CopySharp } from '@vicons/ionicons5'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useNotification } from 'naive-ui/es'
import useLocale from '/@/use/locale'

// ANCHOR Use
const portalPaneStore = usePortalPaneStore()
const notify = useNotification()
const { translate } = useLocale()
// ANCHOR Data
const dockingMode = ref('append')
// ANCHOR Computed
const activatedPortalsCount = computed(
  () => portalPaneStore.activePortals.length
)
const portalsCountBadgeBg = computed(() => {
  if (activatedPortalsCount.value) return '#91B4C0'
  return 'gray'
})
// ANCHOR Methods
const resetAvtivatedPortals = async () => {
  await portalPaneStore.ResetActivePortal()
}
const changeDockingMode = (mode: 'append' | 'override') => {
  portalPaneStore.SetDockingMode(mode)
  dockingMode.value = mode
  notify.success({
    content: `${translate('portalPane.notify.modeChange')}: ${translate(
      `portalPane.mode.${mode}`
    )}`,
    duration: 2000
  })
}
</script>

<style lang="postcss" scoped>
.controls-block {
  /* @apply border-border border-1 m-5 rounded-md p-2; */
  @apply mb-5 flex gap-5 justify-center flex-col;
}

.activated-count {
  @apply flex gap-[10px] items-center font-medium;
}

.controls-btn {
  @apply cursor-pointer text-border  rounded-md font-medium;
  transition: 0.3s;
}

:deep(.n-badge-sup) {
  @apply px-3;
}
</style>
