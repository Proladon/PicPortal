<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-[20px] bg-primary-bg">
      <p class="title">
        <n-icon><Pencil /></n-icon>
        <span>Edit Project</span>
      </p>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :show-label="false"
      >
        <n-form-item path="name">
          <n-input v-model:value="formData.name" placeholder="Project Name" />
        </n-form-item>
        <n-form-item path="path">
          <n-input
            :disabled="importMode"
            v-model:value="formData.path"
            placeholder="Choose a folder"
          />
          <n-button v-if="!importMode" @click="browseFolder">
            <n-icon><FolderOpenOutline /></n-icon>
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-color-picker v-model:value="formData.color" :show-alpha="true" />
        </n-form-item>
      </n-form>
      <n-button block @click="handleConfirm" type="primary">
        {{ importMode ? 'Import' : 'Update' }}
      </n-button>
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
  NColorPicker
} from 'naive-ui/es'
import { FolderOpenOutline, Pencil } from '@vicons/ionicons5'
import { reactive, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { find } from 'lodash-es'
import { useElectron } from '/@/use/electron'
import { saveProjectDialog } from '/@/utils/browserDialog'
import { useNotification } from 'naive-ui'

const emit = defineEmits(['refresh', 'close', 'created'])
const props = defineProps({
  importMode: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: () => ({})
  },
  projects: {
    type: Array,
    default: () => []
  }
})

// ANCHOR Use
const { userStore } = useElectron()
const notify = useNotification()
// ANCHOR Data
const formRef = ref<any>(null)
const showModal = ref<boolean>(false)
const formData = reactive<{ [key: string]: any }>({
  name: null,
  path: null,
  color: null
})
const formRules = {
  name: {
    required: true,
    trigger: 'change',
    message: 'Please input project name'
  },
  path: { required: true, trigger: 'change', message: 'Please choose a folder' }
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

// => 更新專案資訊
const updateProject = async () => {
  const projects = await userStore.get('projects')
  const project = find(projects, { id: props.project.id })
  if (!project) return notify.error({ content: 'Project not found' })
  project.name = formData.name
  project.color = formData.color
  project.path = formData.path
  await userStore.set('projects', projects)
  notify.success({
    content: 'Project updated !',
    duration: 1500
  })
  emit('refresh')
  updateModalShow(false)
}

const importProject = async () => {
  const projects = await userStore.get('projects')
  projects.push({
    id: props.project.id,
    name: formData.name,
    color: formData.color,
    path: formData.path
  })

  await userStore.set('projects', projects)
  notify.success({
    content: 'Project Import !',
    duration: 1500
  })
  emit('refresh')
  updateModalShow(false)
}

const handleConfirm = async () => {
  formRef.value.validate(async (errors: any) => {
    if (errors) return
    if (props.importMode) await importProject()
    else await updateProject()
  })
}

const browseFolder = async (): Promise<void> => {
  const save = await saveProjectDialog()
  if (save.canceled) return
  formData.path = save.filePath
}

const syncData = (keys: string[]) => {
  const values = { ...props.project }
  for (const key of keys) {
    formData[key] = values[key]
  }
}

// ANCHOR Mounted
onMounted(() => {
  showModal.value = true
  syncData(['name', 'path', 'color'])
})
</script>

<style scoped lang="postcss">
.title {
  @apply text-[18px] mb-[20px] flex gap-[5px];
}
</style>
