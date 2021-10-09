<template>
  <div class="labels-group">
    <section class="group-header">
      <n-ellipsis>
        <span @click="expandLabels">{{ groupData.group }}</span>
      </n-ellipsis>
      <div class="controls-icon">
        <n-icon size="20" @click="showProtalTagModal = true"><Add /></n-icon>
        <ProtalTagModal
          mode="create"
          :groupId="groupData.id"
          v-if="showProtalTagModal"
          @close="showProtalTagModal = false"
        />
        <n-icon size="20" v-if="groupData.childs.length" @click="expandLabels">
          <CaretDown />
        </n-icon>
      </div>
    </section>

    <section class="label-item-list" v-if="expand">
      <PortalTag
        v-for="protalTag in groupData.childs"
        :key="protalTag"
        :data="protalTag"
        :groupId="groupData.id"
      />
    </section>
  </div>
</template>

<script setup>
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import {
  Add,
  CaretBackOutline,
  CaretDown,
  PencilSharp,
} from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import PortalTag from './PortalTag.vue'
import ProtalTagModal from './Modal/ProtalTagModal.vue'

// --- Data ---
const props = defineProps({
  groupData: Object,
})

const showProtalTagModal = ref(false)
const expand = ref(false)

// --- Methods ---
const expandLabels = async () => {
  if (!props.groupData.childs.length) return
  expand.value = !expand.value
}
</script>

<style lang="postcss" scoped>
.labels-group {
  @apply flex flex-col;
}

.group-header {
  @apply flex items-center justify-between cursor-pointer;

  .controls-icon {
    @apply flex-shrink-0;
  }
}

.label-item-list {
  @apply text-left py-2;
  @apply flex flex-col gap-3;
}
</style>
