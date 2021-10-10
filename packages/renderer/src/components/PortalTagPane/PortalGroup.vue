<template>
  <div class="portal-group">
    <section class="group-header">
      <n-ellipsis>
        <span @click="expandGroup">{{ groupData.group }}</span>
      </n-ellipsis>
      <div class="controls-icon">
        <n-icon size="20" @click="showPortalTagModal = true"><Add /></n-icon>
        <PortalTagModal
          mode="create"
          :groupId="groupData.id"
          v-if="showPortalTagModal"
          @close="showPortalTagModal = false"
        />
        <n-icon size="20" v-if="groupData.childs.length" @click="expandGroup">
          <CaretDown />
        </n-icon>
      </div>
    </section>

    <section class="portal-tag-list" v-if="expand">
      <PortalTag
        v-for="portalTag in groupData.childs"
        :key="portalTag"
        :data="portalTag"
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
import PortalTagModal from './Modal/PortalTagModal.vue'

// --- Data ---
const props = defineProps({
  groupData: Object,
})

const showPortalTagModal = ref(false)
const expand = ref(false)

// --- Methods ---
const expandGroup = async () => {
  if (!props.groupData.childs.length) return
  expand.value = !expand.value
}
</script>

<style lang="postcss" scoped>
.portal-group {
  @apply flex flex-col;
}

.group-header {
  @apply flex items-center justify-between cursor-pointer;

  .controls-icon {
    @apply flex-shrink-0;
  }
}

.portal-tag-list {
  @apply text-left py-2;
  @apply flex flex-col gap-3;
}
</style>
