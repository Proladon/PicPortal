<template>
  <GDialog v-model="showModal" width="30%">
    <div class="p-5 text-center">
      <p>Add Lable</p>

      <n-form :model="formData" ref="formRef">
        <n-form-item path="name">
          <n-input placeholder="Label Name" v-model:value="formData.name" />
        </n-form-item>
        <n-button @click="addLable">Add</n-button>
      </n-form>
    </div>
  </GDialog>

  <n-icon @click="onOpen"><Add /></n-icon>
</template>

<script lang="ts" setup>
import { Add } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { NButton, NForm, NFormItem, NInput, NIcon } from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'
import { findIndex } from 'lodash-es'
import { nanoid } from 'nanoid/async'

const props = defineProps({
  groupId: String,
})
const store = useStore()
const showModal = ref(false)
const labels = computed(() => store.getters.labels)
const formRef = ref(null)
const formData = reactive({
  name: '',
})

const onOpen = () => {
  showModal.value = true
}

const addLable = async () => {
  if (!formData.name) return
  const labelsRef = labels.value

  const label = {
    name: formData.name,
    id: await nanoid(10),
    color: '',
    link: '',
  }

  const groupIndex = findIndex(labelsRef, { id: props.groupId })
  labelsRef[groupIndex].childs.push(label)

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: JSON.stringify(labelsRef),
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
  showModal.value = false
}
</script>

<style lang="postcss" scoped></style>
