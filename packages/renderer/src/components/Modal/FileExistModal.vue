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

      <div v-if="!rename" class="flex justify-between gap-[20px]">
        <n-button
          class="option-btn"
          secondary
          type="primary"
          @click=";(newFileName = getFileName(data.destPath)), (rename = true)"
        >
          重新命名
        </n-button>
        <n-button class="option-btn" secondary type="info">
          檔名 +(1)
        </n-button>
        <n-button class="option-btn" secondary @click="updateModalShow(false)">
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
import { NModal, NButton, NIcon, NInput, useNotification } from 'naive-ui/es'
import { Warning } from '@vicons/ionicons5'
import { computed, onMounted, ref } from '@vue/runtime-core'
import { useModal } from '/@/use/modal'
import useLocale from '/@/use/locale'
import { localFile, getFileName, getFileDir, getFileExt } from '/@/utils/file'
import { useElectron } from '/@/use/electron'

const notify = useNotification()
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

  const [, err] = await fileSystem[func](filePath, destPath)
  if (err) {
    console.log(err)
    notify.error({
      content: err,
    })
    if (err === 'FILE_EXIST') fileExistError.value = true
    return
  }
  notify.success({
    content: '操作成功',
  })
  updateModalShow(false)
}

onMounted(() => {
  showModal.value = true
  newFileName.value = getFileName(props.data.destPath)
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
