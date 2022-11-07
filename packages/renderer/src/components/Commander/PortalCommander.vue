<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="modal-body">
      <n-input
        v-model:value="searchPortalName"
        autofocus
        :placeholder="translate('portalPane.search.placeholder')"
      />

      <div class="mt-[10px]">
        <div
          v-if="matchPrtals.length"
          v-for="portal in matchPrtals"
          :key="portal.id"
          :class="isSelected(portal)"
        >
          {{ portal.name }}
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal, NInput } from 'naive-ui'
import { onMounted, ref, computed } from 'vue'
import { useModal } from '/@/use/modal'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'

const emit = defineEmits(['close', 'confirm'])
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
const { updateModalShow, showModal } = useModal(emit)

const searchPortalName = ref('')

const matchPrtals = computed(() => {
  if (!searchPortalName.value.trim()) return []
  return portalPaneStore.flattenPortals.filter((i) =>
    i.name.includes(searchPortalName.value)
  )
})

const isSelected = (portal: Portal) => {
  return 'selected'
}

onMounted(() => {
  updateModalShow(true)
})
</script>

<style scoped lang="postcss">
.modal-body {
  @apply bg-primary-bg p-5 min-w-[300px] rounded-lg;
}

.selected {
  @apply bg-border text-darkBlue font-medium rounded-sm p-[3px];
}
</style>
