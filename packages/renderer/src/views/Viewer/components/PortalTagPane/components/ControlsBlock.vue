<template>
  <div class="controls-pane">
    <div class="flex gap-5 flex-wrap">
      <div class="activated-count">
        <NBadge
          :color="portalsCountBadgeBg"
          show-zero
          :value="activatedPortalsCount"
        ></NBadge>
        Activated
      </div>
      <div class="flex flex-wrap gap-2">
        <NButton class="controls-btn" @click="resetAvtivatedPortals">
          Clear</NButton
        >
        <n-radio-group
          v-model:value="dockingMode"
          :on-update:value="changeDockingMode"
        >
          <n-radio-button
            v-for="mode in ['Append', 'Override']"
            :key="mode"
            :value="mode"
          >
            {{ mode }}
          </n-radio-button>
        </n-radio-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from '@vue/reactivity'
import { NButton, NBadge, NRadioGroup, NRadioButton } from 'naive-ui'
import { useStore } from 'vuex'

const store = useStore()
const dockingMode = ref('Append')

const activatedPortalsCount = computed(
  () => store.getters.activedPortals.length
)

const portalsCountBadgeBg = computed(() => {
  if (activatedPortalsCount.value) return '#91B4C0'
  return 'gray'
})

const resetAvtivatedPortals = async () => {
  await store.dispatch('RESET_ACTIVED_PORTALS')
}

const changeDockingMode = (mode: string) => {
  store.commit('SET_DOCKING_MODE', mode)
  dockingMode.value = mode
}
</script>

<style lang="postcss" scoped>
.controls-pane {
  /* @apply border-border border-1 m-5 rounded-md p-2; */
  @apply px-[15px] mb-5 flex gap-5 justify-center flex-col;
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
