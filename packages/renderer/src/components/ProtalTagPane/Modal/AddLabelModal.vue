<template>
  <GDialog
    v-model="showModal"
    width="30%"
    max-width="300px"
    @update:modelValue="closeModal"
  >
    <div class="p-5 text-center">
      <p>Add Protal</p>

      <n-form :model="formData" :rules="formRules" ref="formRef">
        <n-form-item path="name" :show-label="false">
          <n-input placeholder="Protal Name" v-model:value="formData.name" />
        </n-form-item>
        <n-form-item path="link" :show-label="false">
          <n-input
            type="text"
            v-model:value="formData.link"
            placeholder="Protal Link"
          />
          <n-button @click="browseFolder">
            <n-icon><FolderOpenOutline /></n-icon>
          </n-button>
        </n-form-item>
        <n-color-picker v-model:value="formData.color" :show-alpha="false" />
      </n-form>

      <n-button class="mt-[50px]" block @click="addProtal">Add</n-button>
    </div>
  </GDialog>

  <n-icon size="20" @click="openModal"><Add /></n-icon>
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
import { findIndex } from 'lodash-es'
import { nanoid } from 'nanoid/async'
import { useElectron } from '/@/use/electron'

const props = defineProps({
  groupId: String,
})
const { browserDialog, database } = useElectron()
const store = useStore()
const showModal = ref<boolean>(false)
const labels = computed(() => store.getters.labels)

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

const openModal = (): void => {
  showModal.value = true
}
const closeModal = (state: boolean): void => {
  console.log(state)
  if (!state) formRef.value.restoreValidation()
  formData.name = ''
  formData.color = ''
  formData.link = ''
}

const browseFolder = async (): Promise<void> => {
  const res = await browserDialog.open({
    properties: ['openDirectory'],
  })
  console.log(res)
  console.log(res.filePaths[0])
  formData.link = res.filePaths[0]
}

/* eslint-disable no-undef */
const addProtal = async (e): Promise<void> => {
  e.preventDefault()
  formRef.value.validate((errors: any) => {
    console.log(errors)
    if (errors) return
  })
  if (!formData.name) return
  const labelsRef = labels.value

  const label = {
    name: formData.name,
    id: await nanoid(10),
    color: formData.color,
    link: formData.link,
  }

  const groupIndex = findIndex(labelsRef, { id: props.groupId })
  labelsRef[groupIndex].childs.push(label)

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: labelsRef,
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
  showModal.value = false
}
</script>

<style lang="postcss" scoped></style>
