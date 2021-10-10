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
  </GDialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from '@vue/reactivity'
import { NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'
import { nanoid } from 'nanoid/async'
import { onMounted } from '@vue/runtime-core'
import { findIndex } from 'lodash-es'
import { dataClone } from '/@/utils/data'

// --- Data ---
const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  group: Object,
})

const store = useStore()
const showModal = ref(true)

const formRef = ref(null)
const formData = reactive({
  name: '',
})
const formRules = {
  name: { required: true },
}

// --- Computed ---
const portalsData = computed(() => store.getters.portals)
const modalTitle = computed(() => {
  const mode = props.mode
  if (mode === 'edit') return 'Update Protal Group'
  if (mode === 'create') return 'Create Protal Group'
})

// --- Methods ---
const newGroup = async (exist = null) => {
  return {
    group: formData.name,
    id: exist ? exist.id : await nanoid(10),
    childs: exist ? exist.childs : [],
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
      data: portalsRef,
    })
    if (saveError) alert(saveError)

    await store.dispatch('SYNC_DB_TO_STATE', 'portals')
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
    data: portalsRef,
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'portals')
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
  if (props.mode !== 'edit') return
  formData.name = props.group.group
})
</script>

<style lang="postcss" scoped></style>
