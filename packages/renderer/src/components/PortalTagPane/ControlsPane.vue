<template>
  <div class="controls-pane">
    <div class="activated-count">
      <NBadge
        :color="portalsCountBadgeBg"
        show-zero
        :value="activatedPortalsCount"
      ></NBadge>
      Activated
    </div>
    <div class="controls-btn" @click="resetAvtivatedPortals">Clear</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { NButton, NBadge } from 'naive-ui'
import { useStore } from 'vuex'

const store = useStore()

const activatedPortalsCount = computed(
  () => store.getters.activedPortals.length
)

const portalsCountBadgeBg = computed(() => {
  if (activatedPortalsCount.value) return 'var(--skyblue)'
  return 'gray'
})

const resetAvtivatedPortals = async () => {
  await store.dispatch('RESET_ACTIVED_PORTALS')
}
</script>

<style lang="postcss" scoped>
.controls-pane {
  /* @apply border-border border-1 m-5 rounded-md p-2; */
  @apply m-5 flex gap-5 items-center;
}

.activated-count {
  @apply flex gap-[10px] items-center font-medium;
}

.controls-btn {
  @apply px-[10px] py-[3px];
  @apply cursor-pointer border-2 border-border text-border  rounded-md font-medium;
  @apply hover:bg-[skyblue] hover:text-[var(--primary-bg-1)];
  transition: 0.3s;
}
</style>
