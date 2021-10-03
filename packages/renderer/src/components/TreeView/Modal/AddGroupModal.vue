<template>
  <GDialog v-model="showModal" width="30%">
    <div class="p-5 text-center">
      <p>Add Lable Group</p>

      <n-form :model="formData" ref="formRef">
        <n-form-item path="name">
          <n-input placeholder="Group Name" v-model:value="formData.name" />
        </n-form-item>
        <n-button @click="addLableGroup">Add</n-button>
      </n-form>
    </div>
  </GDialog>

  <n-icon @click="onOpen"><FileTray /></n-icon>
</template>

<script lang="ts" setup>
import { FileTray } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { NButton, NForm, NFormItem, NInput, NIcon } from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'

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

const addLableGroup = async () => {
  if (!formData.name) return
  const labelsRef = labels.value
  labelsRef.push({
    group: formData.name,
    order: 0,
    childs: [],
  })

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'labels',
    data: JSON.stringify(labelsRef),
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'labels')
}
</script>

<style lang="postcss" scoped></style>
