<template>
  <div class="labels-group">
    <section class="group-header">
      <n-ellipsis>
        <span @click="expandLabels">{{ groupData.group }}</span>
      </n-ellipsis>
      <div class="controls-icon">
        <AddLabelModal :groupId="groupData.id" />
        <n-icon v-if="groupData.childs.length" @click="expandLabels">
          <CaretDown />
        </n-icon>
      </div>
    </section>

    <section class="label-item-list" v-if="expand">
      <span class="label" v-for="label in groupData.childs" :key="label">{{
        label.name
      }}</span>
    </section>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import { NIcon, NEllipsis, NCheckbox } from 'naive-ui'
import { Add, CaretBackOutline, CaretDown } from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'
import AddLabelModal from '/@/components/TreeView/Modal/AddLabelModal.vue'

const props = defineProps({
  groupData: Object,
})

const expand = ref(false)

const expandLabels = () => {
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
  @apply text-left pl-5 py-2;
  @apply flex flex-col gap-3;
}

.label {
  @apply text-teal-400 px-2 py-1 rounded-md cursor-pointer;
  @apply border-solid border-[2px] border-teal-400;
}
</style>
