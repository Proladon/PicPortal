<template>
  <Dialog :open="showModal" @update:open="updateModalShow">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Pencil class="size-4 text-muted-foreground" />
          {{
            importMode
              ? t('projects.editProject.importTitle')
              : t('projects.editProject.title')
          }}
        </DialogTitle>
        <DialogDescription>{{
          t('projects.createProject.description')
        }}</DialogDescription>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="handleConfirm">
        <ProjectFormFields
          v-model:name="formData.name"
          v-model:path="formData.path"
          v-model:color="formData.color"
          :errors="errors"
          :browsable="!importMode"
          :path-disabled="importMode"
          :path-readonly="desktop.runtime === 'tauri'"
          @browse="browseFolder"
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="updateModalShow(false)"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" class="modal-submit">
            {{
              importMode
                ? t('projects.editProject.import')
                : t('projects.editProject.update')
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { find } from 'lodash-es'
import { Pencil } from '@lucide/vue'
import ProjectFormFields from './ProjectFormFields.vue'
import { Button } from '/@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '/@/components/ui/dialog'
import { useDesktop } from '/@/desktop'
import { useAppStore } from '/@/store/appStore'
import { saveProjectDialog, importProjectDialog } from '/@/utils/browserDialog'
import { useModal } from '/@/use/modal'

const emit = defineEmits(['refresh', 'close', 'created'])
const props = defineProps({
  importMode: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: () => ({}),
  },
  projects: {
    type: Array,
    default: () => [],
  },
})

// ANCHOR Use
const desktop = useDesktop()
const { userStore } = desktop
const { t } = useI18n()
const { showModal, updateModalShow } = useModal(emit)
// ANCHOR Data
const formData = reactive({
  name: '',
  path: '',
  color: '',
})
const errors = reactive<{ name?: string; path?: string }>({})

const validate = () => {
  errors.name = formData.name?.trim()
    ? undefined
    : t('projects.createProject.validation.name')
  errors.path = formData.path
    ? undefined
    : t('projects.createProject.validation.path')
  return !errors.name && !errors.path
}

// => 更新專案資訊
const updateProject = async () => {
  const projects = (await userStore.get('projects')) || []
  const project = find(projects, { id: props.project.id })
  if (!project) return toast.error(t('projects.notify.notFoundProject'))
  project.name = formData.name
  project.color = formData.color
  project.path = formData.path
  await userStore.set('projects', projects)
  if (useAppStore().openProject?.id === project.id)
    useAppStore().SetOpenProject(project)
  toast.success(t('projects.notify.updateSuccess'), { duration: 1500 })
  emit('refresh')
  updateModalShow(false)
}

const importProject = async () => {
  const projects = (await userStore.get('projects')) || []
  projects.push({
    id: props.project.id,
    name: formData.name,
    color: formData.color,
    path: formData.path,
  })

  await userStore.set('projects', projects)
  toast.success(t('projects.notify.importSuccess'), { duration: 1500 })
  emit('refresh')
  updateModalShow(false)
}

const handleConfirm = async () => {
  if (!validate()) return
  if (props.importMode) await importProject()
  else await updateProject()
}

const browseFolder = async (): Promise<void> => {
  const save =
    desktop.runtime === 'tauri'
      ? (await importProjectDialog())?.[0] || null
      : await saveProjectDialog()
  if (save === null) return
  formData.path = save
  errors.path = undefined
}

// ANCHOR Mounted
onMounted(() => {
  showModal.value = true
  formData.name = props.project.name || ''
  formData.path = props.project.path || ''
  formData.color = props.project.color || ''
})
</script>
