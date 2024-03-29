<template>
  <div
    class="project-card"
    :class="{ selected: selected }"
    v-if="!newBtnCard"
    @mouseover="showBtn = true"
    @mouseleave="showBtn = false"
    @click="$emit('open', project)"
  >
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex mb-[20px]">
        <div class="bar" :style="`background: ${project.color}`"></div>
        <p class="project-name">
          <n-ellipsis>
            {{ project.name }}
          </n-ellipsis>
        </p>
      </div>
      <n-scrollbar>
        <div class="project-path h-full">
          {{ project.path }}
        </div>
      </n-scrollbar>
    </div>

    <div v-show="showBtn || selected" class="flex justify-between pt-[10px]">
      <n-button
        size="small"
        @click.stop=";(showEditModal = true), (selected = true)"
      >
        <n-icon><Pencil /></n-icon>
      </n-button>

      <n-button
        type="error"
        secondary
        size="small"
        @click.stop="showDeleteModal = true"
        >{{ translate('common.delete') }}</n-button
      >
    </div>
  </div>

  <n-button
    dashed
    class="project-card !bg-transparent !justify-center"
    v-if="newBtnCard"
    @click="$emit('newProject')"
  >
    <div class="flex flex-col justify-center items-center">
      <n-icon size="50"><Add /></n-icon>
      <p>{{ translate('projects.newProject') }}</p>
    </div>
  </n-button>

  <EditProjectModal
    v-if="showEditModal"
    :project="project"
    @refresh="$emit('refresh')"
    @close=";(showEditModal = false), (selected = false)"
  />

  <DeleteConfirmModal
    v-if="showDeleteModal"
    :project="project"
    @delete="deleteProject"
    @close="showDeleteModal = false"
  />
</template>

<script setup lang="ts">
import { NButton, NEllipsis, NIcon, NScrollbar } from 'naive-ui'
import EditProjectModal from './EditProjectModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import { Add, Pencil } from '@vicons/ionicons5'
import { useElectron } from '/@/use/electron'
import { ref } from '@vue/reactivity'
import { useNotification } from 'naive-ui'
import useLocale from '/@/use/locale'

const { userStore } = useElectron()
const notify = useNotification()
const { translate } = useLocale()

const props = defineProps({
  newBtnCard: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: () => ({}),
  },
})
const emit = defineEmits(['open', 'newProject', 'refresh'])

const showDeleteModal = ref<boolean>(false)
const showEditModal = ref<boolean>(false)
const showBtn = ref<boolean>(false)
const selected = ref<boolean>(false)

const deleteProject = async () => {
  const projects = await userStore.get('projects')
  const filterProjects = projects.filter((i: any) => {
    if (i.id !== props.project.id) return i
    return false
  })
  await userStore.set('projects', filterProjects)
  notify.success({
    content: translate('projects.notify.deleteSuccess'),
    duration: 1500,
  })
  emit('refresh')
}
</script>

<style lang="postcss" scoped>
.project-card {
  @apply w-[150px] h-[200px] flex flex-col justify-between text-base;
  @apply bg-tertiary-bg p-[10px] rounded-[4px] text-left cursor-pointer shadow-xl;
  @apply transition duration-500 ease-in-out;
  @apply border border-1  border-transparent hover:( border-primary );
}

.project-name {
  @apply whitespace-nowrap overflow-hidden text-[20px];
}

.project-path {
  @apply flex-1 break-all;
}

.bar {
  @apply w-1 h-auto rounded-sm bg-primary mr-[10px];
}

.selected {
  @apply border-emerald-200;
}
</style>
