<template>
  <div class="settings">
    <div class="pane left">
      <n-menu v-model:value="activeTab" :options="menuOptions" />
    </div>
    <div class="pane right">
      <n-form v-if="config">
        <n-form-item :label="translate('settings.general.language')">
          <n-select
            v-model:value="formData.general.locale"
            :options="locales"
          />
        </n-form-item>
      </n-form>
    </div>
  </div>

  <SaveDialog
    v-if="showSave"
    @cancel=";(showSave = false), reset()"
    @save="save"
  />
</template>

<script setup lang="ts">
import { NForm, NFormItem, NSelect, NButton, NMenu } from 'naive-ui/es'
import SaveDialog from './components/SaveDialog.vue'
import { reactive, ref, computed } from '@vue/reactivity'
import { useElectron } from '/@/use/electron'
import useLocale from '/@/use/locale'
import { onMounted } from '@vue/runtime-core'
import { isEqual } from 'lodash-es'
import { watch } from '@vue/runtime-core'
import { dataClone } from '/@/utils/data'

const { translate, changeLocale, locale } = useLocale()
const { userStore } = useElectron()

const activeTab = ref('general')
const showSave = ref(false)
const menuOptions = ref()
const formData = reactive({})
const config = ref<any>(null)

const locales = [
  {
    label: 'English',
    value: 'en'
  },
  {
    label: '繁體中文',
    value: 'tw'
  }
]

watch(
  formData,
  () => {
    if (isEqual(config.value, formData)) showSave.value = false
    else showSave.value = true
  },
  { deep: true }
)

const generateMenu = () => {
  const menu = [
    {
      label: translate('settings.general.title'),
      key: 'general'
    }
  ]
  menuOptions.value = menu
}

const save = async () => {
  await userStore.set('settings', dataClone(formData))
  await syncConfig()
  showSave.value = false
}

const reset = () => {
  const data = config.value
  Object.assign(formData, dataClone(data))
}

const syncConfig = async () => {
  const settings = await userStore.get('settings')

  if (!settings)
    await userStore.set('settings', {
      general: {
        locale: 'en'
      }
    })
  changeLocale(settings.general.locale)
  Object.assign(formData, dataClone(settings))
  config.value = dataClone(settings)
  generateMenu()
}

onMounted(async () => {
  await syncConfig()
})
</script>

<style lang="postcss" scoped>
.settings {
  @apply flex gap-[30px] w-full p-[30px];
}

.pane {
  @apply w-full;
}

.left {
  @apply w-[300px];
}
</style>
