<template>
  <div
    class="project-card group relative flex min-h-36 cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
    :class="{ 'border-primary/60 ring-3 ring-primary/20': selected || isOpen }"
    role="button"
    tabindex="0"
    @click="$emit('open', project)"
    @keydown.enter.self="$emit('open', project)"
  >
    <div
      class="absolute inset-x-0 top-0 h-1"
      :style="{ background: project.color || 'var(--border)' }"
    />
    <div class="flex flex-1 flex-col gap-3 p-4 pt-5">
      <div class="flex items-start gap-3 pr-14">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg"
          :style="iconStyle"
        >
          <FolderKanban class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="project-name truncate font-medium leading-snug"
            :title="project.name"
          >
            {{ project.name }}
          </p>
          <p class="truncate text-xs text-muted-foreground">{{ fileName }}</p>
        </div>
      </div>
      <p
        class="project-path line-clamp-2 break-all font-mono text-[11px] leading-relaxed text-muted-foreground"
        :title="project.path"
      >
        {{ project.path }}
      </p>
      <Badge v-if="isOpen" variant="secondary" class="mt-auto">
        <CircleDot class="text-primary" />
        {{ t('projects.card.current') }}
      </Badge>
    </div>

    <div
      class="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      :class="{ 'opacity-100': selected }"
    >
      <Button
        size="icon-xs"
        variant="secondary"
        :aria-label="t('projects.card.edit')"
        :title="t('projects.card.edit')"
        @click.stop=";(showEditModal = true), (selected = true)"
      >
        <Pencil />
      </Button>
      <Button
        size="icon-xs"
        variant="secondary"
        class="hover:text-destructive"
        :aria-label="t('projects.card.delete')"
        :title="t('projects.card.delete')"
        @click.stop="showDeleteModal = true"
      >
        <Trash2 />
      </Button>
    </div>
  </div>

  <EditProjectModal
    v-if="showEditModal"
    :project="project"
    @refresh="$emit('refresh')"
    @close=";(showEditModal = false), (selected = false)"
  />

  <ConfirmDialog
    v-if="showDeleteModal"
    :title="t('projects.deleteProject.title')"
    :content="t('projects.deleteProject.content', { name: project.name })"
    :confirm-text="t('common.delete')"
    @confirm="deleteProject"
    @close="showDeleteModal = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { CircleDot, FolderKanban, Pencil, Trash2 } from '@lucide/vue'
import EditProjectModal from './EditProjectModal.vue'
import ConfirmDialog from '/@/components/ConfirmDialog.vue'
import { Badge } from '/@/components/ui/badge'
import { Button } from '/@/components/ui/button'
import { useDesktop } from '/@/desktop'
import { useAppStore } from '/@/store/appStore'
import { getFileName } from '/@/utils/file'

const { userStore } = useDesktop()
const { t } = useI18n()

const props = defineProps({
  project: {
    type: Object,
    default: () => ({}),
  },
})
const emit = defineEmits(['open', 'refresh'])

const showDeleteModal = ref<boolean>(false)
const showEditModal = ref<boolean>(false)
const selected = ref<boolean>(false)

const fileName = computed(() => `${getFileName(props.project.path)}.db`)
const isOpen = computed(
  () => useAppStore().openProject?.id === props.project.id
)
const iconStyle = computed(() => {
  const color = props.project.color
  if (!color)
    return { background: 'var(--muted)', color: 'var(--muted-foreground)' }
  return {
    background: `color-mix(in oklab, ${color} 18%, transparent)`,
    color,
  }
})

const deleteProject = async () => {
  const projects = (await userStore.get('projects')) || []
  const filterProjects = projects.filter((i: any) => {
    if (i.id !== props.project.id) return i
    return false
  })
  await userStore.set('projects', filterProjects)
  toast.success(t('projects.notify.deleteSuccess'), { duration: 1500 })
  emit('refresh')
}
</script>
