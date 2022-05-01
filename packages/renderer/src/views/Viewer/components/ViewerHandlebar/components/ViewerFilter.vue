<template>
  <n-collapse-transition :show="showing">
    <div class="py-2 flex whitespace-nowrap items-center">
      <n-checkbox v-model:checked="onlyDockings">Only Dockings</n-checkbox>

      <n-select
        v-model:value="selectedPortals"
        multiple
        filterable
        placeholder="Filter Portals"
        :options="availablePortals"
      />
    </div>
  </n-collapse-transition>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { NCollapseTransition, NCheckbox, NSelect } from 'naive-ui/es'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useViewerStore } from '/@/store/viewerStore'
import { map } from 'lodash-es'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

const viewerStore = useViewerStore()
const portalPaneStore = usePortalPaneStore()
const onlyDockings = computed({
  get() {
    return viewerStore.filter.onlyDockings
  },
  set(show: boolean) {
    if (!show) viewerStore.filter.portals = []
    viewerStore.filter.onlyDockings = show
  }
})
const selectedPortals = computed({
  get() {
    return viewerStore.filter.portals
  },
  set(data: string[]) {
    if (data.length) viewerStore.filter.onlyDockings = true
    else if (!data.length) viewerStore.filter.onlyDockings = false
    viewerStore.filter.portals = data
  }
})

const showing = computed({
  get(): boolean {
    return props.show
  },
  set(v: boolean) {
    emit('update:show', v)
  }
})

const availablePortals = computed(() => {
  return map(portalPaneStore.flattenPortals, (portal: Portal) => ({
    label: portal.name,
    value: portal.id
  }))
})
</script>

<style lang="postcss" scoped></style>
