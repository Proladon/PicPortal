<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    :on-update:show="updateModalShow"
  >
    <div class="modal-body">
      <div class="header">
        <n-icon size="24"><Warning /></n-icon>
        <p>{{ translate('common.warning') }} - {{ data.mode }}</p>
      </div>
      <div class="modal-content">
        <div class="preview-container">
          <img class="preview-img" :src="localFile(data.filePath)" />
          <div class="preview-path">{{ data.filePath }}</div>
        </div>
        <div class="preview-container">
          <img class="preview-img" :src="localFile(data.destPath)" />
          <div class="preview-path">{{ data.destPath }}</div>
        </div>
      </div>
      <div class="py-[10px]">
        <n-checkbox v-model:checked="viewerStore.wrap.sameOperation.enable">
          以下 {{ viewerStore.wrap.filesExist.length }} 個檔案皆同樣操作
        </n-checkbox>
      </div>
      <div v-if="!rename" class="grid grid-cols-5 gap-[20px]">
        <n-button
          :disabled="viewerStore.wrap.sameOperation.enable"
          class="option-btn"
          secondary
          type="primary"
          @click=";(newFileName = getFileName(data.destPath)), (rename = true)"
        >
          重新命名
        </n-button>
        <n-button
          class="option-btn"
          secondary
          type="info"
          @click="renameFileWithNumber(data.mode)"
        >
          檔名 +(1)
        </n-button>
        <n-button
          class="option-btn"
          type="error"
          secondary
          @click="handleDelete"
        >
          刪除檔案
        </n-button>
        <n-button
          class="option-btn"
          type="warning"
          secondary
          @click="handleOverride"
        >
          覆蓋
        </n-button>
        <n-button class="option-btn" secondary @click="handleSkip">
          忽略
        </n-button>
      </div>

      <div v-if="rename">
        <p class="text-border">New filename</p>
        <n-input clearable :status="renameError" v-model:value="newFileName" />
      </div>

      <div class="modal-footer" v-if="rename">
        <n-button @click="rename = false">
          {{ translate('common.cancel') }}
        </n-button>
        <n-button
          :disabled="disableRename"
          ghost
          type="primary"
          @click="renameFile(data.mode)"
        >
          {{ translate('common.confirm') }}
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import {
  NModal,
  NCheckbox,
  NButton,
  NIcon,
  NInput,
  useNotification,
} from 'naive-ui'
import { Warning } from '@vicons/ionicons5'
import { computed, onMounted, ref } from '@vue/runtime-core'
import { useModal } from '/@/use/modal'
import useLocale from '/@/use/locale'
import { localFile, getFileName, getFileDir, getFileExt } from '/@/utils/file'
import { useElectron } from '/@/use/electron'
import { useViewerStore } from '/@/store/viewerStore'

const notify = useNotification()
const viewerStore = useViewerStore()
const { translate } = useLocale()
const { fileSystem } = useElectron()
const emit = defineEmits(['close', 'confirm'])
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const { updateModalShow, showModal } = useModal(emit)

const rename = ref<boolean>(false)
const newFileName = ref<string>('')
const fileExistError = ref<boolean>(false)
const renameError = computed(() => {
  if (!newFileName.value) return 'error'
  if (newFileName.value.includes('/')) return 'error'
  if (fileExistError.value) return 'error'
  return ''
})
const disableRename = computed(() => {
  if (newFileName.value === getFileName(props.data.filePath)) return true
  if (!newFileName.value) return true
  if (newFileName.value.includes('/')) return true
  return false
})

const fileExt = computed(() => getFileExt(props.data.filePath))

const renameFile = async (mode: 'move' | 'copy') => {
  if (renameError.value) return
  const filePath = props.data.filePath
  const destPath = `${getFileDir(props.data.destPath)}/${newFileName.value}${
    fileExt.value
  }`
  const func = mode === 'copy' ? 'copyFile' : 'moveFile'
  const task = async () => {
    const [, err] = await fileSystem[func](filePath, destPath)
    if (err) {
      console.log(err)
      notify.error({
        content: err,
      })
      if (err === 'FILE_EXIST') fileExistError.value = true
      return
    }
  }
  viewerStore.PushToFileExistQueue(task)
  updateModalShow(false)
}

const renameFileWithNumber = async (mode: 'move' | 'copy') => {
  if (viewerStore.wrap.sameOperation.enable) {
    viewerStore.wrap.sameOperation.action = 'plusNum'
  }
  if (renameError.value) return
  const filePath = props.data.filePath
  const dirPath = props.data.destPath
  const task = async () => {
    let count = 1
    let pass = false
    const func = mode === 'copy' ? 'copyFile' : 'moveFile'
    while (!pass) {
      const destPath = `${getFileDir(dirPath)}/${newFileName.value}(${count})${
        fileExt.value
      }`
      const [, err] = await fileSystem[func](filePath, destPath)
      if (err) {
        if (err === 'FILE_EXIST') count++
      }
      if (!err) pass = true
    }
  }
  viewerStore.PushToFileExistQueue(task)
  updateModalShow(false)
}

const handleSkip = () => {
  if (viewerStore.wrap.sameOperation.enable) {
    viewerStore.wrap.sameOperation.action = 'skip'
  }
  updateModalShow(false)
}

const handleDelete = async () => {
  if (viewerStore.wrap.sameOperation.enable) {
    viewerStore.wrap.sameOperation.action = 'delete'
  }
  const filePath = props.data.filePath
  const task = async () => {
    const [, err] = await fileSystem.deleteFile(filePath)
    if (err) {
      notify.error({
        content: err,
      })
      return
    }
  }
  viewerStore.PushToFileExistQueue(task)
  updateModalShow(false)
}

const handleOverride = async () => {
  if (viewerStore.wrap.sameOperation.enable) {
    viewerStore.wrap.sameOperation.action = 'override'
  }
  const filePath = props.data.filePath
  const dirPath = props.data.destPath
  const task = async () => {
    const destPath = `${getFileDir(dirPath)}/${newFileName.value}${
      fileExt.value
    }`
    const [, err] = await fileSystem.overrideFile(filePath, destPath)
    if (err) {
      notify.error({
        content: err,
      })
      return
    }
  }
  viewerStore.PushToFileExistQueue(task)
  updateModalShow(false)
}

onMounted(() => {
  newFileName.value = getFileName(props.data.destPath)
  if (viewerStore.wrap.sameOperation.enable) {
    const action = viewerStore.wrap.sameOperation.action
    if (action === 'plusNum') renameFileWithNumber(props.data.mode)
    else if (action === 'delete') handleDelete()
    else if (action === 'override') handleOverride()
    else if (action === 'skip') updateModalShow(false)
    return
  }
  showModal.value = true
})
</script>

<style lang="postcss" scoped>
.modal-body {
  @apply bg-primary-bg p-5 min-w-[300px];
}

.header {
  @apply flex items-end justify-start gap-[10px] text-[20px] text-red-400;
}

.modal-content {
  @apply py-[15px] flex justify-center gap-[50px];
}

.modal-footer {
  @apply flex justify-end gap-[10px] mt-[20px];
}

.preview-container {
  @apply flex items-center justify-start flex-col gap-[20px];
}
.preview-img {
  @apply w-[200px] h-[200px] object-cover rounded-sm;
}
.preview-path {
  @apply w-[200px] break-all;
}

.option-btn {
  @apply flex-1 h-[100px];
}
</style>
