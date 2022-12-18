<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="modal-body">
      <input
        class="search-input"
        v-model="searchPortalName"
        :placeholder="translate('portalPane.search.placeholder')"
        @keydown.up.prevent="onKeyUp"
        @keydown.down.prevent="onKeyDown"
        @keydown.enter.prevent="onSelect"
      />
      <n-divider />
      <div
        class="mt-[10px] max-h-[200px] overflow-y-auto"
        v-if="matchPrtals.length"
      >
        <div
          class="portal-option"
          v-for="(portal, index) in matchPrtals"
          :key="portal.id"
          :class="isSelected(index)"
          @mouseover="selectIndex = index"
          @click="selectPortal(index)"
        >
          {{ portal.name }} ({{ portal.group.group }})
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NDivider } from 'naive-ui'
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useModal } from '/@/use/modal'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'
import { find } from 'lodash-es'

const emit = defineEmits(['close', 'confirm'])
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
const { updateModalShow, showModal } = useModal(emit)

const searchPortalName = ref('')
const selectIndex = ref(0)

watch(selectIndex, async () => {
  await nextTick()
  const a = document.querySelector('.selected')
  a?.scrollIntoView()
})

const matchPrtals = computed(() => {
  if (searchPortalName.value === '*') return portalPaneStore.flattenPortals
  if (!searchPortalName.value.trim()) return []
  return portalPaneStore.flattenPortals.filter((i) => {
    const name = i.name.toLowerCase()
    const searchName = searchPortalName.value.toLowerCase()
    return name.includes(searchName)
  })
})

const selectPortal = (index: number) => {
  selectIndex.value = index
  onSelect()
}

const onKeyUp = () => {
  if (selectIndex.value > 0) selectIndex.value--
  else if (selectIndex.value === 0) {
    if (!matchPrtals.value.length) return
    selectIndex.value = matchPrtals.value.length - 1
  }
}
const onKeyDown = () => {
  const last = matchPrtals.value.length - 1
  if (selectIndex.value < last) selectIndex.value++
  else if (selectIndex.value === last) selectIndex.value = 0
}
const onSelect = () => {
  const portal: Portal = matchPrtals.value[selectIndex.value]
  const portalGroup: PortalGroup | undefined = find(
    portalPaneStore.portals,
    (group) => find(group.childs, { id: portal.id })
  )
  if (portalGroup) {
    portalPaneStore.AddActivedPortal({
      id: portal.id,
      group: portalGroup.id,
    })
  }
  updateModalShow(false)
}

const isSelected = (index: number) => {
  if (index === selectIndex.value) return 'selected'
  return ''
}

onMounted(() => {
  updateModalShow(true)
})
</script>

<style scoped lang="postcss">
.modal-body {
  @apply bg-primary-bg p-5 min-w-[300px] rounded-lg text-base;
  @apply fixed top-[30%] left-0 right-0 w-[500px];
}

.portal-option {
  @apply p-[3px] text-[18px] cursor-pointer;
}

.selected {
  @apply bg-primary text-dark rounded-sm;
}

.search-input {
  @apply bg-transparent w-full border-none outline-none text-[30px];
}
</style>
