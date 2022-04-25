<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-[20px] bg-primary-bg">
      <n-form :model="formData" :show-label="false">
        <n-form-item path="name">
          <n-input v-model:value="formData.name" placeholder="Project Name" />
        </n-form-item>
        <n-form-item path="path">
          <n-input
            v-model:value="formData.path"
            placeholder="Choose a folder"
          />
          <n-button @click="browseFolder">
            <n-icon><FolderOpenOutline /></n-icon>
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-color-picker v-model:value="formData.color" :show-alpha="true" />
        </n-form-item>
      </n-form>
      <n-button @click="createNewProject">創建</n-button>
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
import { FolderOpenOutline } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useElectron } from '/@/use/electron'
import { getFileName } from '/@/utils/file'
import path from 'path'

const emit = defineEmits(['close', 'created'])

// ANCHOR Use
const { fileSystem, userStore, browserDialog } = useElectron()
// ANCHOR Data
const showModal = ref<boolean>(false)
const formData = reactive({
  path: null,
  color: null
})
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
  if (createErr) return console.log(createErr)
  const newProjectData = {
    name: formData.name,
    mainFolder: '',
    color: formData.color,
    portals: [],
    dockings: []
  }
  console.log(newProjectData)
  const [, writeErr] = await fileSystem.writeJson(filePath, newProjectData)
  if (writeErr) return console.log(writeErr)
}

const createNewProject = async () => {
  const filePath = `${formData.path}/${formData.name}.db`
  await createDBFile(filePath)
  emit('created', {
    name: formData.name,
    path: filePath,
    color: formData.color
  })
}

const browseFolder = async (): Promise<void> => {
  const res = await browserDialog.open({
    properties: ['openDirectory']
  })
  formData.path = res.filePaths[0]
}

// ANCHOR Mounted
onMounted(() => {
  showModal.value = true
})
</script>

<style scoped lang="postcss"></style>
