<template>
  <Dialog :open="showModal" @update:open="updateModalShow">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ modalTitle }}</DialogTitle>
      </DialogHeader>

      <form
        class="grid gap-4"
        @submit.prevent="mode === 'edit' ? updatePortal() : createPortal()"
      >
        <Tabs v-model="tab" class="gap-4">
          <TabsList v-if="mode === 'create'" class="w-full">
            <TabsTrigger value="manual">
              <PencilLine />
              {{ t('portalPane.portalModal.mode.manual') }}
            </TabsTrigger>
            <TabsTrigger value="drop">
              <FolderInput />
              {{ t('portalPane.portalModal.mode.drop') }}
            </TabsTrigger>
          </TabsList>

          <!-- Manual Tab -->
          <TabsContent value="manual">
            <FieldGroup class="gap-4">
              <Field :data-invalid="!!errors.name || undefined">
                <FieldLabel for="portal-name">{{
                  t('portalPane.portalModal.fields.name')
                }}</FieldLabel>
                <Input
                  id="portal-name"
                  v-model="formData.name"
                  autocomplete="off"
                  :aria-invalid="!!errors.name || undefined"
                  :placeholder="t('portalPane.portalModal.placeholder.name')"
                />
              </Field>
              <Field :data-invalid="!!errors.link || undefined">
                <FieldLabel for="portal-link">{{
                  t('portalPane.portalModal.fields.link')
                }}</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="portal-link"
                    v-model="formData.link"
                    class="font-mono text-xs"
                    :readonly="desktop.runtime === 'tauri'"
                    :aria-invalid="!!errors.link || undefined"
                    :placeholder="t('portalPane.portalModal.placeholder.link')"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      class="path-browse"
                      size="icon-xs"
                      :aria-label="t('common.browse')"
                      :title="t('common.browse')"
                      @click="browseFolder"
                    >
                      <FolderOpen />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <div class="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>{{
                    t('portalPane.portalModal.fields.bg')
                  }}</FieldLabel>
                  <ColorPicker v-model="formData.bg" />
                </Field>
                <Field>
                  <FieldLabel>{{
                    t('portalPane.portalModal.fields.fg')
                  }}</FieldLabel>
                  <ColorPicker v-model="formData.fg" />
                </Field>
              </div>
              <div
                class="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5"
              >
                <span class="text-xs text-muted-foreground">
                  {{ t('portalPane.portalModal.fields.preview') }}
                </span>
                <span
                  class="inline-flex h-7 max-w-full items-center truncate rounded-md border px-2.5 text-sm font-medium"
                  :class="
                    formData.bg
                      ? ''
                      : 'border-transparent bg-primary text-primary-foreground'
                  "
                  :style="portalChipStyle(formData)"
                >
                  {{
                    formData.name ||
                    t('portalPane.portalModal.placeholder.name')
                  }}
                </span>
              </div>
            </FieldGroup>
          </TabsContent>

          <!-- Drop Tab -->
          <TabsContent
            v-if="mode === 'create'"
            value="drop"
            class="flex flex-col gap-3"
          >
            <DropZone
              :class="dropList.length ? 'h-16' : 'h-36'"
              :hint="t('portalPane.portalModal.dropHint')"
              @drop="onDrop"
              @paths="(paths: string[]) => dropList.push(...paths.filter(path => !dropList.includes(path)))"
            />
            <div v-if="dropList.length" class="flex flex-col gap-2">
              <p class="text-xs text-muted-foreground">
                {{
                  t('portalPane.portalModal.dropCount', {
                    count: dropList.length,
                  })
                }}
              </p>
              <div
                class="folder-list flex max-h-40 flex-wrap gap-1.5 overflow-y-auto"
              >
                <Tooltip v-for="folder in dropList" :key="folder">
                  <TooltipTrigger as-child>
                    <span
                      class="folder-item inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border bg-secondary pr-1 pl-2 text-xs text-secondary-foreground"
                    >
                      <Folder class="size-3.5 shrink-0 text-muted-foreground" />
                      <span class="truncate">{{ getFileName(folder) }}</span>
                      <button
                        type="button"
                        class="inline-flex size-5 items-center justify-center rounded-sm opacity-60 hover:bg-foreground/10 hover:opacity-100"
                        :aria-label="t('common.delete')"
                        @click="removeDropped(folder)"
                      >
                        <X class="size-3" />
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-sm break-all">{{
                    folder
                  }}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="updateModalShow(false)"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            type="submit"
            class="modal-submit"
            :disabled="mode === 'create' && disabledCreate"
          >
            {{ mode === 'edit' ? t('common.update') : t('common.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, onMounted } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { Folder, FolderInput, FolderOpen, PencilLine, X } from '@lucide/vue'
import { findIndex } from 'lodash-es'
import { nanoid } from 'nanoid/async'
import ColorPicker from '/@/components/ColorPicker.vue'
import DropZone from '/@/components/DropZone.vue'
import { Button } from '/@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '/@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '/@/components/ui/field'
import { Input } from '/@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '/@/components/ui/input-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '/@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { useDesktop } from '/@/desktop'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/file'
import { portalChipStyle } from '/@/utils/color'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useModal } from '/@/use/modal'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  data: {
    type: Object as PropType<{ groupId: string; portal?: Portal }>,
    default: () => ({ groupId: '' }),
  },
})
const desktop = useDesktop()
const { browserDialog, getDroppedPaths } = desktop
const appStore = useAppStore()
const portalPanelStore = usePortalPaneStore()
const { t } = useI18n()
const { showModal, updateModalShow } = useModal(emit)

const tab = ref<string | number>('manual')
const dropList = ref<string[]>([])
const formData = reactive({
  name: '',
  link: '',
  bg: '',
  fg: '',
})
const errors = reactive<{ name?: boolean; link?: boolean }>({})

// ANCHOR --- Computed ---
const modalTitle = computed(() => {
  let title = ''
  switch (props.mode) {
    case 'create':
      title = t('portalPane.portalModal.title.create')
      break
    case 'edit':
      title = t('portalPane.portalModal.title.edit')
      break
  }
  return title
})
const portalsData = computed(() => portalPanelStore.portals)
const disabledCreate = computed(() => {
  if (tab.value == 'manual') {
    if (!formData.name || !formData.link) return true
  }
  if (tab.value == 'drop') {
    if (!dropList.value.length) return true
  }
  return false
})
// ANCHOR --- Methods ---
const validate = () => {
  errors.name = !formData.name.trim()
  errors.link = !formData.link
  return !errors.name && !errors.link
}

const browseFolder = async (): Promise<void> => {
  const res = await browserDialog.open({
    directory: true,
  })
  if (res) formData.link = res[0]
}

const newPortal = async (exist?: string) => {
  return {
    name: formData.name,
    id: exist || (await nanoid(10)),
    bg: formData.bg,
    fg: formData.fg,
    link: formData.link,
  }
}

const updateDBData = async (data: unknown): Promise<void> => {
  const [, saveError] = await appStore.SaveToDB({ key: 'portals', data })
  if (saveError) alert(saveError)

  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
}

// => 新增 PortalTag
const createPortal = async (): Promise<void> => {
  if (disabledCreate.value) return
  const portals = dataClone(portalsData.value)
  const groupIndex = findIndex(portals, { id: props.data?.groupId })
  if (tab.value == 'manual') {
    if (!validate()) return
    const portal = await newPortal()
    portals[groupIndex].childs.push(portal)
  } else if (tab.value === 'drop') {
    for (const folder of dropList.value) {
      const portal = {
        name: getFileName(folder),
        id: await nanoid(10),
        bg: '',
        fg: '',
        link: folder,
      }
      portals[groupIndex].childs.push(portal)
    }
  }
  await updateDBData(portals)
  updateModalShow(false)
}

// => 更新 PortalTag
const updatePortal = async () => {
  const currentPortal = props.data.portal
  if (!currentPortal || !validate()) return

  const portals = dataClone(portalsData.value)
  const portal = await newPortal(currentPortal.id)
  const groupIndex = findIndex(portals, { id: props.data.groupId })
  const portalIndex = findIndex(portals[groupIndex].childs, {
    id: currentPortal.id,
  })
  portals[groupIndex].childs[portalIndex] = portal
  await updateDBData(portals)
  updateModalShow(false)
}

const onDrop = (files: File[] | null) => {
  const ignore = ['image', 'video', 'audio']
  if (!files) return
  const folders = files.filter(
    (file) => !ignore.includes(file.type.split('/')[0])
  )
  const paths = getDroppedPaths(folders)
  dropList.value.push(...paths.filter((path) => !dropList.value.includes(path)))
}

const removeDropped = (folder: string) => {
  dropList.value = dropList.value.filter((item) => item !== folder)
}

onMounted(() => {
  showModal.value = true
  if (props.mode === 'edit' && props.data.portal) {
    const portal = props.data.portal
    formData.name = portal.name
    formData.bg = portal.bg
    formData.fg = portal.fg
    formData.link = portal.link
  }
})
</script>
