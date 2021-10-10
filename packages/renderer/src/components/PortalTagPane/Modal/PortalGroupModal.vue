<template>
  <GDialog v-model="showModal" width="30%" @update:modelValue="closeModal">
    <div class="p-5 text-center">
      <p>Create Portal Group</p>

      <n-form :model="formData" ref="formRef">
        <n-form-item path="name">
          <n-input placeholder="Group Name" v-model:value="formData.name" />
        </n-form-item>
        <n-button @click="createPortalGroup">Create</n-button>
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

const emit = defineEmits(['close'])

const store = useStore()
const showModal = ref(true)
const portalsData = computed(() => store.getters.portals)
const formRef = ref(null)
const formData = reactive({
  name: '',
})

const createPortalGroup = async () => {
  if (!formData.name) return
  const portalsRef = portalsData.value
  portalsRef.push({
    group: formData.name,
    id: await nanoid(10),
    childs: [],
  })

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'portals',
    data: portalsRef,
  })
  if (saveError) alert(saveError)

  await store.dispatch('SYNC_DB_TO_STATE', 'portals')
  showModal.value = false
}

const closeModal = (state: boolean): void => {
  setTimeout(() => {
    emit('close')
  }, 150)
}
</script>

<style lang="postcss" scoped></style>
