<template>
  <GDialog v-model="showModal" width="30%">
    <div class="p-5 text-center">
      <p>Add Lable Group</p>

      <n-form>
        <n-form-item>
          <n-input placeholder="Group Name" />
        </n-form-item>
        <n-button @click="addLableGroup">Add</n-button>
      </n-form>
    </div>
  </GDialog>

  <button @click="onOpen">
    <n-icon><Folder /></n-icon>
  </button>
</template>

<script lang="ts" setup>
import { Folder } from '@vicons/ionicons5'
import { ref } from '@vue/reactivity'
import { NButton, NForm, NFormItem, NInput, NIcon } from 'naive-ui'
import { GDialog } from 'gitart-vue-dialog'
import { useStore } from 'vuex'

const props = defineProps({
  lables: Array,
})

const store = useStore()
const showModal = ref(false)
const onOpen = () => {
  showModal.value = true
}

const addLableGroup = async () => {
  const lables = props.lables
  lables.push({
    group: 'test',
    order: 0,
    childs: [],
  })

  const [, saveError] = await store.dispatch('SAVE_TO_DB', {
    key: 'lables',
    data: JSON.stringify(lables),
  })
  if (saveError) alert(saveError)

  const [getRes, getError] = await store.dispatch('DB_GET', 'lables')
  if (getError) alert(getError)
  lables.value = getRes

  await store.dispatch('SYNC_DB_STATE', { key: 'lables', dbData: getRes })
}
</script>

<style lang="postcss" scoped></style>
