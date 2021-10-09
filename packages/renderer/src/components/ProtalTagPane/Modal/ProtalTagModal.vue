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

      <n-button
        v-if="mode === 'create'"
        class="mt-[50px]"
        block
        @click="addProtal"
        >Add</n-button
      >
      <n-button
        v-if="mode === 'edit'"
        class="mt-[50px]"
        block
        @click="updateProtal"
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
  protal: Object,
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
const protalsData = computed(() => store.getters.labels)

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
  console.log(res)
  console.log(res.filePaths[0])
  formData.link = res.filePaths[0]
}

const addProtal = async (e): Promise<void> => {
  e.preventDefault()
  formRef.value.validate((errors: any) => {
    console.log(errors)
    if (errors) return
  })

  if (!formData.name) return
  const labelsRef = protalsData.value

  const protal = {
    name: formData.name,
    id: await nanoid(10),
    color: formData.color,
    link: formData.link,
  }

  const groupIndex = findIndex(labelsRef, { id: props.groupId })

  labelsRef[groupIndex].childs.push(protal)

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: labelsRef,
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
  emit('close')
}

const updateProtal = async (e) => {
  e.preventDefault()
  formRef.value.validate((errors: any) => {
    console.log(errors)
    if (errors) return
  })

  if (!formData.name) return
  const labelsRef = protalsData.value

  const protal = {
    name: formData.name,
    id: await nanoid(10),
    color: formData.color,
    link: formData.link,
  }

  const groupIndex = findIndex(labelsRef, { id: props.protal.groupId })
  console.log(props.protal)

  const protalIndex = findIndex(labelsRef[groupIndex].childs, {
    id: props.protal.protal.id,
  })
  console.log(labelsRef[groupIndex][protalIndex])
  labelsRef[groupIndex].childs[protalIndex] = protal
  console.log(labelsRef)

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: labelsRef,
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
  emit('close')
}

onMounted(() => {
  if (props.mode === 'edit' && props.protal) {
    const protal = props.protal
    formData.name = protal.protal.name
    formData.color = protal.protal.color
    formData.link = protal.protal.link
  }
})
</script>

<style lang="postcss" scoped></style>
