<template>
  <Dialog :open="showModal" @update:open="updateModalShow">
    <DialogContent
      class="modal-body sm:max-w-2xl"
      :show-close-button="false"
      @escape-key-down.prevent
      @pointer-down-outside.prevent
      @interact-outside.prevent
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <TriangleAlert class="size-4 text-warning" />
          {{ t('viewer.conflict.title') }}
          <Badge variant="secondary" class="font-mono">{{ data.mode }}</Badge>
        </DialogTitle>
        <DialogDescription>{{
          t('viewer.conflict.description')
        }}</DialogDescription>
      </DialogHeader>

      <div class="modal-content grid grid-cols-2 gap-4">
        <figure
          v-for="item in previews"
          :key="item.label"
          class="preview-container flex min-w-0 flex-col gap-2"
        >
          <figcaption
            class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <component :is="item.icon" class="size-3.5" />
            {{ item.label }}
          </figcaption>
          <div
            class="aspect-[4/3] overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
          >
            <img
              class="preview-img size-full object-contain"
              :src="localFile(item.path)"
            />
          </div>
          <p
            class="preview-path font-mono text-[11px] leading-relaxed break-all text-muted-foreground"
          >
            {{ item.path }}
          </p>
        </figure>
      </div>

      <template v-if="!rename">
        <label class="flex items-center gap-2 text-sm">
          <Checkbox v-model="viewerStore.wrap.sameOperation.enable" />
          {{ t('viewer.conflict.sameOperation') }}
        </label>
        <div class="grid grid-cols-5 gap-2">
          <Button
            v-for="option in options"
            :key="option.action"
            type="button"
            variant="outline"
            class="option-btn h-auto flex-col gap-1.5 py-3 whitespace-normal"
            :class="option.class"
            :data-action="option.action"
            :disabled="option.disabled"
            @click="option.run"
            ><component :is="option.icon" class="size-5" />{{
              option.label
            }}</Button
          >
        </div>
      </template>

      <form v-else class="grid gap-4" @submit.prevent="renameFile">
        <Field :data-invalid="!!renameError || undefined">
          <FieldLabel for="conflict-rename">{{
            t('viewer.conflict.newFileName')
          }}</FieldLabel>
          <Input
            id="conflict-rename"
            v-model="newFileName"
            class="rename-input"
            autocomplete="off"
            :aria-invalid="!!renameError || undefined"
          />
          <FieldError v-if="renameError">{{
            t('viewer.conflict.invalidFileName')
          }}</FieldError>
        </Field>
        <DialogFooter class="modal-footer">
          <Button type="button" variant="outline" @click="rename = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="disableRename">
            {{ t('common.confirm') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CopyPlus,
  FileInput,
  FileOutput,
  PencilLine,
  Replace,
  SkipForward,
  Trash2,
  TriangleAlert,
} from '@lucide/vue'
import { Badge } from '/@/components/ui/badge'
import { Button } from '/@/components/ui/button'
import { Checkbox } from '/@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '/@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '/@/components/ui/field'
import { Input } from '/@/components/ui/input'
import { useModal } from '/@/use/modal'
import { localFile, getFileName } from '/@/utils/file'
import { useViewerStore } from '/@/store/viewerStore'

const viewerStore = useViewerStore()
const { t } = useI18n()
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
  if (/[\\/:*?"<>|]/.test(newFileName.value) || /[. ]$/.test(newFileName.value))
    return 'error'
  return ''
})
const disableRename = computed(() => {
  if (newFileName.value === getFileName(props.data.filePath)) return true
  if (!newFileName.value) return true
  if (/[\\/:*?"<>|]/.test(newFileName.value) || /[. ]$/.test(newFileName.value))
    return true
  return false
})

const previews = computed(() => [
  {
    label: t('viewer.conflict.source'),
    path: props.data.filePath,
    icon: FileOutput,
  },
  {
    label: t('viewer.conflict.destination'),
    path: props.data.destPath,
    icon: FileInput,
  },
])

const decide = (
  action: 'skip' | 'plusNum' | 'delete' | 'override' | 'rename'
) => {
  viewerStore.ResolveConflict(props.data.id, action, newFileName.value)
}
const renameFile = () => {
  if (!renameError.value) decide('rename')
}
const renameFileWithNumber = () => decide('plusNum')
const handleSkip = () => decide('skip')
const handleDelete = () => decide('delete')
const handleOverride = () => decide('override')
const startRename = () => {
  newFileName.value = getFileName(props.data.destPath)
  rename.value = true
}

const options = computed(() => [
  {
    action: 'rename',
    label: t('viewer.conflict.rename'),
    icon: PencilLine,
    disabled: viewerStore.wrap.sameOperation.enable,
    class: '',
    run: startRename,
  },
  {
    action: 'plusNum',
    label: t('viewer.conflict.plusNum'),
    icon: CopyPlus,
    disabled: false,
    class: '',
    run: renameFileWithNumber,
  },
  {
    action: 'delete',
    label: t('viewer.conflict.delete'),
    icon: Trash2,
    disabled: false,
    class: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
    run: handleDelete,
  },
  {
    action: 'override',
    label: t('viewer.conflict.override'),
    icon: Replace,
    disabled: false,
    class: 'text-warning hover:bg-warning/10 hover:text-warning',
    run: handleOverride,
  },
  {
    action: 'skip',
    label: t('viewer.conflict.skip'),
    icon: SkipForward,
    disabled: false,
    class: '',
    run: handleSkip,
  },
])

onMounted(() => {
  newFileName.value = getFileName(props.data.destPath)
  showModal.value = true
})
</script>
