<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="p-5 text-center bg-primary-bg">
      <p>{{ modalTitle }}</p>

      <n-form :model="formData" :rules="formRules" ref="formRef">
        <n-form-item path="name">
          <n-input
            :placeholder="
              translate('portalPane.portalGroupModal.placeholder.name')
            "
            v-model:value="formData.name"
          />
        </n-form-item>
        <n-button
          v-if="mode === 'edit'"
          secondary
          block
          type="primary"
          @click="updatePortalGroup"
          >{{ translate('common.update') }}</n-button
        >
        <n-button
          v-if="mode === 'create'"
          secondary
          block
          type="primary"
          @click="createPortalGroup"
          >{{ translate('common.create') }}</n-button
        >
      </n-form>
    </div>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from '@vue/reactivity'
import { NModal, NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { nanoid } from 'nanoid/async'
import { onMounted } from '@vue/runtime-core'
import { findIndex } from 'lodash-es'
import { dataClone } from '/@/utils/data'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import useLocale from '/@/use/locale'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  group: Object,
})

const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { translate } = useLocale()
// --- Data ---
const showModal = ref(false)

const formRef = ref<any>(null)
const formData = reactive({
  name: '',
})
const formRules = {
  name: { required: true },
}

// --- Computed ---
const portalsData = computed(() => portalPaneStore.portals)
const modalTitle = computed(() => {
  const mode = props.mode
  if (mode === 'edit')
    return translate('portalPane.portalGroupModal.title.edit')
  if (mode === 'create')
    return translate('portalPane.portalGroupModal.title.create')
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
    childs: exist ? exist.childs : [],
  }
}
const updatePortalGroup = async (): Promise<void> => {
  formRef.value.validate(async (errors: any) => {
    if (errors) return

    const portalsRef = dataClone(portalsData.value)
    const group = await newGroup(props.group)

    const groupIndex = findIndex(portalsRef, { id: props.group.id })
    portalsRef[groupIndex] = group

    const [, saveError] = await appStore.SaveToDB({
      key: 'portals',
      data: portalsRef,
    })
    if (saveError) alert(saveError)

    await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
    showModal.value = false
    closeModal()
  })
}

const createPortalGroup = async (): Promise<void> => {
  if (!formData.name) return
  const portalsRef = dataClone(portalsData.value)
  const group = await newGroup()
  portalsRef.push(group)

  const [, saveError] = await appStore.SaveToDB({
    key: 'portals',
    data: portalsRef,
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
