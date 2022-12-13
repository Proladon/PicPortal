<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-5 text-center bg-primary-bg w-[260px]">
      <p>{{ modalTitle }}</p>

      <n-tabs
        v-model:value="tab"
        type="line"
        justify-content="space-evenly"
        class="mb-[10px] h-[220px]"
      >
        <!-- Manual Tab -->
        <n-tab-pane
          name="manual"
          :tab="translate('portalPane.portalModal.mode.manual')"
        >
          <n-form :model="formData" :rules="formRules" ref="formRef">
            <n-form-item path="name" :show-label="false">
              <n-input
                :placeholder="
                  translate('portalPane.portalModal.placeholder.name')
                "
                v-model:value="formData.name"
              />
            </n-form-item>
            <n-form-item path="link" :show-label="false">
              <n-input
                type="text"
                v-model:value="formData.link"
                :placeholder="
                  translate('portalPane.portalModal.placeholder.link')
                "
              />
              <n-button @click="browseFolder">
                <n-icon><FolderOpenOutline /></n-icon>
              </n-button>
            </n-form-item>
            <n-color-picker
              placeholder="背景顏色"
              v-model:value="formData.bg"
              :show-alpha="false"
            />
            <n-color-picker
              placeholder="文字顏色"
              v-model:value="formData.fg"
              :show-alpha="false"
            />
          </n-form>
        </n-tab-pane>
        <!-- Drop Tab -->
        <n-tab-pane
          v-if="mode === 'create'"
          name="drop"
          :tab="translate('portalPane.portalModal.mode.drop')"
          class="flex flex-col h-full"
        >
          <DropZone
            :class="{ 'drop-zone-collapse': dropList.length }"
            @drop="onDrop"
          />
          <n-scrollbar class="mt-[10px]">
            <div class="folder-list">
              <n-tooltip
                :delay="500"
                trigger="hover"
                v-for="folder in dropList"
                :key="folder"
              >
                <template #trigger>
                  <n-tag class="folder-item">
                    {{ getFileName(folder) }}
                  </n-tag>
                </template>
                {{ folder }}
              </n-tooltip>
            </div>
          </n-scrollbar>
        </n-tab-pane>
      </n-tabs>

      <n-button
        v-if="mode === 'create'"
        :disabled="disabledCreate"
        class="mt-[50px]"
        secondary
        block
        type="primary"
        @click="createPortal"
        >{{ translate('common.create') }}</n-button
      >
      <n-button
        v-if="mode === 'edit'"
        class="mt-[50px]"
        secondary
        block
        type="primary"
        @click="updatePortal"
        >{{ translate('common.update') }}</n-button
      >
    </div>
  </n-modal>
</template>

<script lang="ts" setup>
import { FolderOpenOutline, Archive } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NIcon,
  NColorPicker,
  NModal,
  NTabs,
  NTabPane,
  NScrollbar,
  NTooltip,
  NTag,
  useMessage,
} from 'naive-ui'
import { findIndex } from 'lodash-es'
import { nanoid } from 'nanoid/async'
import { useElectron } from '/@/use/electron'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/file'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'
import DropZone from '/@/components/DropZone.vue'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  data: Object,
})
const { browserDialog } = useElectron()
const message = useMessage()
const appStore = useAppStore()
const portalPanelStore = usePortalPaneStore()
const { translate } = useLocale()

const tab = ref<'manual' | 'drop'>('manual')
const dropList = ref<string[]>([])
const showModal = ref<boolean>(false)
const formRef = ref(null)
const formData = reactive({
  name: '',
  link: '',
  bg: '',
  fg: '',
})
const formRules = {
  name: { required: true },
  bg: { required: false },
  fg: { required: false },
  link: { required: true },
}

// ANCHOR --- Computed ---
const modalTitle = computed(() => {
  let title = ''
  switch (props.mode) {
    case 'create':
      title = translate('portalPane.portalModal.title.create')
      break
    case 'edit':
      title = translate('portalPane.portalModal.title.edit')
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
const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 300)
  }
  showModal.value = show
}

const browseFolder = async (): Promise<void> => {
  const res = await browserDialog.open({
    properties: ['openDirectory'],
  })
  formData.link = res.filePaths[0]
}

const newPortal = async (exist = null) => {
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
  const portals = dataClone(portalsData.value)
  const groupIndex = findIndex(portals, { id: props.data?.groupId })
  if (tab.value == 'manual') {
    await formRef.value.validate(async (errors: any) => {
      if (errors) return
      const portal = await newPortal()
      portals[groupIndex].childs.push(portal)
    })
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
  showModal.value = false
  updateModalShow(false)
}

// => 更新 PortalTag
const updatePortal = async () => {
  await formRef.value.validate(async (errors: any) => {
    if (errors) return

    const portals = dataClone(portalsData.value)
    const portal = await newPortal(props.data.portal.id)
    const groupIndex = findIndex(portals, { id: props.data.groupId })
    const portalIndex = findIndex(portals[groupIndex].childs, {
      id: props.data.portal.id,
    })
    portals[groupIndex].childs[portalIndex] = portal
    await updateDBData(portals)
    showModal.value = false
    updateModalShow(false)
  })
}

const onDrop = (files: File[] | null) => {
  const ignore = ['image', 'video', 'audio']
  if (!files) return
  for (const f of files) {
    if (!ignore.includes(f.type.split('/')[0])) {
      dropList.value.push(f.path)
    }
  }
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

<style lang="postcss" scoped>
.drop-zone-collapse {
  @apply !h-[80px];
}
.folder-list {
  @apply flex flex-col gap-[5px];
}
.folder-item {
  @apply text-left w-full hover:(bg-border text-primary-bg);
}
</style>
