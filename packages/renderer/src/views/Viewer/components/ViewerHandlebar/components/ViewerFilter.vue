<template>
  <n-collapse-transition :show="showing">
    <div class="py-2 flex whitespace-nowrap items-center gap-[10px]">
      <n-checkbox v-model:checked="onlyDockings">Only Dockings</n-checkbox>

      <n-select
        v-model:value="selectedPortals"
        multiple
        filterable
        placeholder="Filter Portals"
        :options="availablePortals"
      />
      <n-select
        v-model:value="selectedFileTypes"
        multiple
        filterable
        placeholder="Filter Files Types"
        :options="availableFileTypes"
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

const selectedFileTypes = computed({
  get() {
    return viewerStore.filter.fileTypes
  },
  set(data: string[]) {
    viewerStore.filter.fileTypes = data
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
const availableFileTypes = [
  { label: 'png', value: 'png' },
  { label: 'jpg', value: 'jpg' },
  { label: 'jpeg', value: 'jpeg' },
  { label: 'webp', value: 'webp' },
  { label: 'gif', value: 'gif' }
]
</script>

<style lang="postcss" scoped></style>
