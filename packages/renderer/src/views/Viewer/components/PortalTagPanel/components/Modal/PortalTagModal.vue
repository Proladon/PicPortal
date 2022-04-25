<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-5 text-center bg-primary-bg">
      <p>{{ modalTitle }}</p>

      <n-tabs
        v-model:value="type"
        type="line"
        justify-content="space-evenly"
        class="mb-[10px]"
      >
        <n-tab-pane name="manaul" tab="Manaul">
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
        <n-tab-pane name="drop" tab="Drop">
          <div>
            <label for="drop-zone" @drop="drop">dwqdqwd</label>
            <input id="drop-zone" type="file" @drop="drop" />
            <n-icon size="48" :depth="3">
              <Archive />
            </n-icon>
          </div>
        </n-tab-pane>
      </n-tabs>

      <n-button
        v-if="mode === 'create'"
        class="mt-[50px]"
        block
        @click="addPortal"
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
  messageDark,
  useMessage
} from 'naive-ui'
import { useStore } from 'vuex'
import { findIndex } from 'lodash-es'
import { nanoid } from 'nanoid/async'
import { useElectron } from '/@/use/electron'
import { onMounted } from '@vue/runtime-core'
import { dataClone } from '/@/utils/data'

const emit = defineEmits(['close'])
const props = defineProps({
  groupId: String,
  mode: String,
  portal: Object
})
const { browserDialog } = useElectron()
const store = useStore()
const message = useMessage()
const type = ref('manaul')
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

// --- Computed ---
const modalTitle = computed(() => {
  let title = ''
  switch (props.mode) {
    case 'create':
      title = 'Add Portal Tag'
      break
    case 'edit':
      title = 'Update Portal Tag'
      break
  }
  return title
})
const portalsData = computed(() => store.getters.portals)

// --- Methods ---
const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 1500)
  }
  showModal.value = show
}
const closeModal = (): void => {
  // if (!state) formRef.value.restoreValidation()
  // formData.name = ''
  // formData.color = ''
  // formData.link = ''
  setTimeout(() => {
    console.log('close')
    emit('close')
  }, 1500)
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
  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'portals',
    data
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'portals')
}

// => 新增 PortalTag
const addPortal = async (e): Promise<void> => {
  e.preventDefault()
  await formRef.value.validate(async (errors: any) => {
    if (errors) return

    const portals = portalsData.value
    const portal = await newPortal()
    const groupIndex = findIndex(portals, { id: props.groupId })
    portals[groupIndex].childs.push(portal)
    await updateDBData(portals)
    showModal.value = false
    closeModal()
  })
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
    closeModal()
  })
}

const drop = (e) => {
  let folders = []
  const ignore = ['image', 'video', 'audio']
  let count = 0
  // Get every
  for (let i of e.dataTransfer.items) {
    if (i.kind !== 'file' || ignore.includes(i.type.split('/')[0])) {
      // Error not folder
      message.error('Only support folder !')
      return
    } else {
      count += 1
      folders.push(i.getAsFile().path)
    }
  }
  console.log(folders)
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
input {
  cursor: default;
  all: unset;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  outline: none;
  caret-color: transparent;
}
</style>
