<template>
  <GDialog v-model="showModal" width="30%">
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

  <n-icon @click="onOpen"><FileTray /></n-icon>
</template>

<script lang="ts" setup>
import { FileTray } from '@vicons/ionicons5'
import { computed, reactive, ref } from '@vue/reactivity'
import { NButton, NForm, NFormItem, NInput, NIcon } from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'
import { nanoid } from 'nanoid/async'

const store = useStore()
const showModal = ref(false)
const portalsData = computed(() => store.getters.portals)
const formRef = ref(null)
const formData = reactive({
  name: '',
})

const onOpen = () => {
  showModal.value = true
}

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
</script>

<style lang="postcss" scoped></style>
