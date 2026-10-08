<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-[20px] bg-primary-bg">
      <p>{{ translate('projects.createProject.title') }}</p>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :show-label="false"
      >
        <n-form-item path="name">
          <n-input
            v-model:value="formData.name"
            :placeholder="
              translate('projects.createProject.placeholder.projectName')
            "
          />
        </n-form-item>
        <n-form-item path="path">
          <!-- TODO default save dialog file name -->
          <n-input
            v-model:value="formData.path"
            :readonly="desktop.runtime === 'tauri'"
            :placeholder="
              translate('projects.createProject.placeholder.projectPath')
            "
          />
          <n-button @click="browseFolder">
            <n-icon><FolderOpenOutline /></n-icon>
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-color-picker v-model:value="formData.color" :show-alpha="true" />
        </n-form-item>
      </n-form>
      <n-button block secondary type="primary" @click="createNewProject">{{
        translate('projects.createProject.create')
      }}</n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import {
  NModal,
  NForm,
  NFormItem,
  NButton,
  NIcon,
  NInput,
  NColorPicker,
  useNotification,
} from 'naive-ui'
import { FolderOpenOutline } from '@vicons/ionicons5'
import { reactive, ref } from 'vue'
import { nanoid } from 'nanoid/async'
import { onMounted } from 'vue'
import { useDesktop } from '/@/desktop'
import { saveProjectDialog } from '/@/utils/browserDialog'
import useLocale from '/@/use/locale'

const emit = defineEmits(['refresh', 'close', 'created'])

// ANCHOR Use
const desktop = useDesktop()
const { fileSystem, userStore } = desktop
const notify = useNotification()
const { translate } = useLocale()
// ANCHOR Data
const formRef = ref<any>(null)
const showModal = ref<boolean>(false)
const formData = reactive({
  name: '',
  path: '',
  color: '',
})
const formRules = {
  name: {
    required: true,
    trigger: 'change',
    message: 'Project Name is required',
  },
  path: {
    required: true,
    trigger: 'change',
    message: 'Project Path is required',
  },
}
// ANCHOR Methods
const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 300)
  }
  showModal.value = show
}

// => 創建DB檔
const createDBFile = async (filePath: string) => {
  const [, createErr] = await fileSystem.createFile(filePath)
  if (createErr) {
    notify.error({
      content: `createDBFile: ${createErr}`,
    })
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
    notify.error({ content: `createDBFile: ${writeErr}` })
    return false
  }
  return id
}

const createNewProject = async () => {
  formRef.value.validate(async (errors: any) => {
    if (errors) return
    const filePath = formData.path!
    const projectId = await createDBFile(filePath)
    if (!projectId)
      return notify.error({ content: 'Generate project id failed' })

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
    notify.success({
      content: translate('projects.notify.createSuccess'),
      duration: 1500,
    })
    if (desktop.runtime === 'tauri') emit('created', newProject)
    else emit('refresh')
    updateModalShow(false)
  })
}

const browseFolder = async (): Promise<void> => {
  const save = await saveProjectDialog()
  if (save === null) return
  formData.path = save
}

// ANCHOR Mounted
onMounted(() => {
  showModal.value = true
})
</script>

<style scoped lang="postcss"></style>
