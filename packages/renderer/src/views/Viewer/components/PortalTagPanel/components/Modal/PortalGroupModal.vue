<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-5 text-center bg-primary-bg">
      <p>{{ modalTitle }}</p>

      <n-form :model="formData" :rules="formRules" ref="formRef">
        <n-form-item path="name">
          <n-input placeholder="Group Name" v-model:value="formData.name" />
        </n-form-item>
        <n-button v-if="mode === 'edit'" @click="updatePortalGroup"
          >Update</n-button
        >
        <n-button v-if="mode === 'create'" @click="createPortalGroup"
          >Create</n-button
        >
      </n-form>
    </div>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from '@vue/reactivity'
import { NModal, NButton, NForm, NFormItem, NInput } from 'naive-ui/es'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'
import { nanoid } from 'nanoid/async'
import { onMounted } from '@vue/runtime-core'
import { findIndex } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { useAppStore } from '/@/store/appStore'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  group: Object
})

const store = useStore()
const appStore = useAppStore()
// --- Data ---
const showModal = ref(false)

const formRef = ref(null)
const formData = reactive({
  name: ''
})
const formRules = {
  name: { required: true }
}

// --- Computed ---
const portalsData = computed(() => store.getters.portals)
const modalTitle = computed(() => {
  const mode = props.mode
  if (mode === 'edit') return 'Update Portal Group'
  if (mode === 'create') return 'Create Portal Group'
})

// --- Methods ---
const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 1500)
  }
  showModal.value = show
}
const newGroup = async (exist = null) => {
  return {
    group: formData.name,
    id: exist ? exist.id : await nanoid(10),
    childs: exist ? exist.childs : []
  }
}
const updatePortalGroup = async (): Promise<void> => {
  formRef.value.validate(async (errors) => {
    if (errors) return

    const portalsRef = dataClone(portalsData.value)
    const group = await newGroup(props.group)

    const groupIndex = findIndex(portalsRef, { id: props.group.id })
    portalsRef[groupIndex] = group

    const [, saveError] = await store.dispatch('SAVE_TO_DB', {
      key: 'portals',
      data: portalsRef
    })
    if (saveError) alert(saveError)

    await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
    showModal.value = false
    closeModal()
  })
}

const createPortalGroup = async (): Promise<void> => {
  if (!formData.name) return
  const portalsRef = portalsData.value
  const group = await newGroup()
  portalsRef.push(group)

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'portals',
    data: portalsRef
  })
  if (saveError) alert(saveError)

  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
  showModal.value = false
  closeModal()
}

const closeModal = (): void => {
  setTimeout(() => {
    emit('close')
  }, 150)
}

// --- Mounted ---
onMounted((): void => {
  showModal.value = true
  if (props.mode !== 'edit') return
  formData.name = props.group.group
})
</script>

<style lang="postcss" scoped></style>
