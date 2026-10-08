<template>
  <Dialog :open="showModal" @update:open="updateModalShow">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('projects.createProject.title') }}</DialogTitle>
        <DialogDescription>{{
          t('projects.createProject.description')
        }}</DialogDescription>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="createNewProject">
        <ProjectFormFields
          v-model:name="formData.name"
          v-model:path="formData.path"
          v-model:color="formData.color"
          :errors="errors"
          path-readonly
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
          <Button type="submit" class="modal-submit" :disabled="submitting">
            <Spinner v-if="submitting" />
            {{ t('projects.createProject.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { nanoid } from 'nanoid/async'
import ProjectFormFields from './ProjectFormFields.vue'
import { Button } from '/@/components/ui/button'
import { Spinner } from '/@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '/@/components/ui/dialog'
import { useDesktop } from '/@/desktop'
import { saveProjectDialog } from '/@/utils/browserDialog'
import { useModal } from '/@/use/modal'

const emit = defineEmits(['close', 'created'])

// ANCHOR Use
const { fileSystem, userStore } = useDesktop()
const { t } = useI18n()
const { showModal, updateModalShow } = useModal(emit)
// ANCHOR Data
const submitting = ref(false)
const formData = reactive({
  name: '',
  path: '',
  color: '',
})
const errors = reactive<{ name?: string; path?: string }>({})

const validate = () => {
  errors.name = formData.name.trim()
    ? undefined
    : t('projects.createProject.validation.name')
  errors.path = formData.path
    ? undefined
    : t('projects.createProject.validation.path')
  return !errors.name && !errors.path
}

// => 創建DB檔
const createDBFile = async (filePath: string) => {
  const [, createErr] = await fileSystem.createFile(filePath)
  if (createErr) {
    toast.error(`createDBFile: ${createErr}`)
    return false
  }
  const id = await nanoid(10)
  const newProjectData = {
    id,
    mainFolder: '',
    dockings: [],
    portals: [],
  }
  const [, writeErr] = await fileSystem.writeJson(filePath, newProjectData)
  if (writeErr) {
    toast.error(`createDBFile: ${writeErr}`)
    return false
  }
  return id
}

const createNewProject = async () => {
  if (!validate() || submitting.value) return
  submitting.value = true
  try {
    const filePath = formData.path
    const projectId = await createDBFile(filePath)
    if (!projectId) return toast.error('Generate project id failed')

    const newProject = {
      name: formData.name,
      id: projectId,
      path: filePath,
      color: formData.color,
    }

    const projects = await userStore.get('projects')
    const nextProjects = projects || []
    nextProjects.push(newProject)
    await userStore.set('projects', nextProjects)
    toast.success(t('projects.notify.createSuccess'), { duration: 1500 })
    emit('created', newProject)
    updateModalShow(false)
  } finally {
    submitting.value = false
  }
}

const browseFolder = async (): Promise<void> => {
  const save = await saveProjectDialog()
  if (save === null) return
  formData.path = save
  errors.path = undefined
}

// ANCHOR Mounted
onMounted(() => {
  showModal.value = true
})
</script>
