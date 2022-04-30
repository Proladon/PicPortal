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
        <n-tab-pane name="manual" tab="Manual">
          <n-form :model="formData" :rules="formRules" ref="formRef">
            <n-form-item path="name" :show-label="false">
              <n-input
                placeholder="Portal Name"
                v-model:value="formData.name"
              />
            </n-form-item>
            <n-form-item path="link" :show-label="false">
              <n-input
                type="text"
                v-model:value="formData.link"
                placeholder="Portal Link"
              />
              <n-button @click="browseFolder">
                <n-icon><FolderOpenOutline /></n-icon>
              </n-button>
            </n-form-item>
            <n-color-picker v-model:value="formData.bg" :show-alpha="false" />
            <n-color-picker v-model:value="formData.fg" :show-alpha="false" />
          </n-form>
        </n-tab-pane>
        <!-- Drop Tab -->
        <n-tab-pane name="drop" tab="Drop" class="flex flex-col h-full">
          <n-button
            class="cursor-default h-full"
            :class="{ 'drop-zone-collapse': dropList.length }"
            dashed
            block
            @drop="drop"
            @dragenter.prevent
            @dragover.prevent
          >
            <n-icon size="24" :depth="3">
              <Archive />
            </n-icon>
          </n-button>
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
        block
        @click="createPortal"
        >Add</n-button
      >
      <n-button
        v-if="mode === 'edit'"
        class="mt-[50px]"
        block
        @click="updatePortal"
        >Update</n-button
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
  useMessage
} from 'naive-ui/es'
import { useStore } from 'vuex'
import { findIndex, forEach } from 'lodash-es'
import { nanoid } from 'nanoid/async'
import { useElectron } from '/@/use/electron'
import { dataClone } from '/@/utils/data'
import { getFileName } from '/@/utils/file'
import { useAppStore } from '/@/store/appStore'

const emit = defineEmits(['close'])
const props = defineProps({
  groupId: String,
  mode: String,
  portal: Object
})
const { browserDialog } = useElectron()
const store = useStore()
const message = useMessage()
const appStore = useAppStore()

const tab = ref<'manual' | 'drop'>('manual')
const dropList = ref<string[]>([])
const showModal = ref<boolean>(false)
const formRef = ref(null)
const formData = reactive({
  name: '',
  link: '',
  bg: '',
  fg: ''
})
const formRules = {
  name: { required: true },
  bg: { required: false },
  fg: { required: false },
  link: { required: true }
}

// ANCHOR --- Computed ---
const modalTitle = computed(() => {
  let title = ''
  switch (props.mode) {
    case 'create':
      title = 'Create Portal'
      break
    case 'edit':
      title = 'Update Portal'
      break
  }
  return title
})
const portalsData = computed(() => store.getters.portals)
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
    properties: ['openDirectory']
  })
  formData.link = res.filePaths[0]
}

const newPortal = async (exist = null) => {
  return {
    name: formData.name,
    id: exist || (await nanoid(10)),
    bg: formData.bg,
    fg: formData.fg,
    link: formData.link
  }
}

const updateDBData = async (data: unknown): Promise<void> => {
  const [, saveError] = await appStore.SaveToDB({ key: 'portals', data })
  if (saveError) alert(saveError)

  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
}

// => 新增 PortalTag
const createPortal = async (e): Promise<void> => {
  e.preventDefault()
  console.log(tab.value)
  const portals = dataClone(portalsData.value)
  const groupIndex = findIndex(portals, { id: props.groupId })
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
        link: folder
      }
      portals[groupIndex].childs.push(portal)
    }
  }
  console.log(portals[groupIndex].childs)
  await updateDBData(portals)
  showModal.value = false
  updateModalShow(false)
}

// => 更新 PortalTag
const updatePortal = async (e) => {
  e.preventDefault()
  console.log(0)
  await formRef.value.validate(async (errors: any) => {
    if (errors) return

    const portals = dataClone(portalsData.value)
    const portal = await newPortal(props.portal.portal.id)
    const groupIndex = findIndex(portals, { id: props.portal.groupId })
    const portalIndex = findIndex(portals[groupIndex].childs, {
      id: props.portal.portal.id
    })
    portals[groupIndex].childs[portalIndex] = portal
    await updateDBData(portals)
    showModal.value = false
    updateModalShow(false)
  })
}

const drop = (e) => {
  const ignore = ['image', 'video', 'audio']
  // Get every
  for (let i of e.dataTransfer.items) {
    if (i.kind !== 'file' || ignore.includes(i.type.split('/')[0])) {
      // Error not folder
      message.error('Only support folder !')
      return
    } else {
      dropList.value.push(i.getAsFile().path)
    }
  }
  // Check Repeat
}

onMounted(() => {
  showModal.value = true
  if (props.mode === 'edit' && props.portal) {
    const portal = props.portal
    formData.name = portal.portal.name
    formData.bg = portal.portal.bg
    formData.fg = portal.portal.fg
    formData.link = portal.portal.link
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
