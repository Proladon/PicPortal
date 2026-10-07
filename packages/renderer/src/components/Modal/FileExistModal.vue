<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    :close-on-esc="false"
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
          後續衝突皆同樣操作
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
          @click="renameFileWithNumber"
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
        <n-input clearable :status="renameError || undefined" v-model:value="newFileName" />
      </div>

      <div class="modal-footer" v-if="rename">
        <n-button @click="rename = false">
          {{ translate('common.cancel') }}
        </n-button>
        <n-button
          :disabled="disableRename"
          ghost
          type="primary"
          @click="renameFile"
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
} from 'naive-ui'
import { Warning } from '@vicons/ionicons5'
import { computed, onMounted, ref } from '@vue/runtime-core'
import { useModal } from '/@/use/modal'
import useLocale from '/@/use/locale'
import { localFile, getFileName } from '/@/utils/file'
import { useViewerStore } from '/@/store/viewerStore'

const viewerStore = useViewerStore()
const { translate } = useLocale()
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
const renameError = computed(() => {
  if (!newFileName.value) return 'error'
  if (/[\\/:*?"<>|]/.test(newFileName.value) || /[. ]$/.test(newFileName.value)) return 'error'
  return ''
})
const disableRename = computed(() => {
  if (newFileName.value === getFileName(props.data.filePath)) return true
  if (!newFileName.value) return true
  if (/[\\/:*?"<>|]/.test(newFileName.value) || /[. ]$/.test(newFileName.value)) return true
  return false
})

const decide = (action: 'skip' | 'plusNum' | 'delete' | 'override' | 'rename') => {
  viewerStore.ResolveConflict(props.data.id, action, newFileName.value)
}
const renameFile = () => { if (!renameError.value) decide('rename') }
const renameFileWithNumber = () => decide('plusNum')
const handleSkip = () => decide('skip')
const handleDelete = () => decide('delete')
const handleOverride = () => decide('override')

onMounted(() => {
  newFileName.value = getFileName(props.data.destPath)
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
