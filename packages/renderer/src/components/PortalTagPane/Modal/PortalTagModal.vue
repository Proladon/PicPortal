<template>
  <GDialog
    v-model="showModal"
    width="30%"
    max-width="300px"
    @update:modelValue="closeModal"
  >
    <div class="p-5 text-center">
      <p>{{ modalTitle }}</p>

      <n-form :model="formData" :rules="formRules" ref="formRef">
        <n-form-item path="name" :show-label="false">
          <n-input placeholder="Portal Name" v-model:value="formData.name" />
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
        <n-color-picker v-model:value="formData.color" :show-alpha="false" />
      </n-form>

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
  </GDialog>
</template>

<script lang="ts" setup>
import { Add, FolderOpenOutline } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NIcon,
  NColorPicker,
} from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'
import { findIndex, find } from 'lodash-es'
import { nanoid } from 'nanoid/async'
import { useElectron } from '/@/use/electron'
import { onMounted } from '@vue/runtime-core'

const emit = defineEmits(['close'])
const props = defineProps({
  groupId: String,
  show: Boolean,
  mode: String,
  portal: Object,
})
const { browserDialog, database } = useElectron()
const store = useStore()
const showModal = ref<boolean>(true)
const formRef = ref(null)
const formData = reactive({
  name: '',
  color: '',
  link: '',
})
const formRules = {
  name: { required: true },
  color: { required: false },
  link: { required: true },
}

// --- Computed ---
const modalTitle = computed(() => {
  let title = ''
  switch (props.mode) {
    case 'create':
      title = 'Add Protal Tag'
      break
    case 'edit':
      title = 'Update Protal Tag'
      break
  }
  return title
})
const portalsData = computed(() => store.getters.portals)

// --- Methods ---
const openModal = (): void => {
  showModal.value = true
}
const closeModal = (state: boolean): void => {
  // if (!state) formRef.value.restoreValidation()
  // formData.name = ''
  // formData.color = ''
  // formData.link = ''
  setTimeout(() => {
    emit('close')
  }, 150)
}

const browseFolder = async (): Promise<void> => {
  const res = await browserDialog.open({
    properties: ['openDirectory'],
  })
  formData.link = res.filePaths[0]
}

const newPortal = async () => {
  return {
    name: formData.name,
    id: await nanoid(10),
    color: formData.color,
    link: formData.link,
  }
}

// => 新增 PortalTag
const addPortal = async (e): Promise<void> => {
  e.preventDefault()
  await formRef.value.validate(async (errors: any) => {
    console.log(errors)
    if (errors) return

    const portals = portalsData.value
    const portal = await newPortal()
    const groupIndex = findIndex(portals, { id: props.groupId })
    portals[groupIndex].childs.push(portal)
    const [, saveError] = await store.dispatch('SAVE_TO_DB', {
      key: 'portals',
      data: portals,
    })
    if (saveError) alert(saveError)

    await store.dispatch('SYNC_DB_TO_STATE', 'portals')
    emit('close')
  })
}

// => 更新 PortalTag
const updatePortal = async (e) => {
  e.preventDefault()
  await formRef.value.validate(async (errors: any) => {
    if (errors) return

    const portals = portalsData.value
    const portal = await newPortal()
    const groupIndex = findIndex(portals, { id: props.portal.groupId })
    const portalIndex = findIndex(portals[groupIndex].childs, {
      id: props.portal.portal.id,
    })
    portals[groupIndex].childs[portalIndex] = portal
    const [, saveError] = await store.dispatch('SAVE_TO_DB', {
      key: 'portals',
      data: portals,
    })
    if (saveError) alert(saveError)

    await store.dispatch('SYNC_DB_TO_STATE', 'portals')
    emit('close')
  })
}

onMounted(() => {
  if (props.mode === 'edit' && props.portal) {
    const portal = props.portal
    formData.name = portal.portal.name
    formData.color = portal.portal.color
    formData.link = portal.portal.link
  }
})
</script>

<style lang="postcss" scoped></style>
