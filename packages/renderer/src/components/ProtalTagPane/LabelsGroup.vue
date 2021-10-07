<template>
  <div class="labels-group">
    <section class="group-header">
      <n-ellipsis>
        <span @click="expandLabels">{{ groupData.group }}</span>
      </n-ellipsis>
      <div class="controls-icon">
        <AddLabelModal :groupId="groupData.id" />
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
import draggable from 'vuedraggable'
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import {
  Add,
  CaretBackOutline,
  CaretDown,
  PencilSharp,
} from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'
import AddLabelModal from '/@/components/ProtalTagPane/Modal/AddLabelModal.vue'
import { nextTick, onMounted } from '@vue/runtime-core'
import PortalTag from '/@/components/ProtalTagPane/PortalTag.vue'

// const labelAnime = animate('.label', { y: 100 }, { delay: stagger(0.1) })

const props = defineProps({
  groupData: Object,
})

const expand = ref(false)

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
