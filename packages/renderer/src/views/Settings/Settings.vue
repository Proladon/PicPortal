<template>
  <n-spin :show="loading" class="w-full h-full">
    <div class="settings">
      <div class="pane left">
        <n-menu v-model:value="activeTab" :options="menuOptions" />
      </div>
      <div class="pane right" v-if="formData.general">
        <GeneralSettings
          v-if="activeTab === 'general'"
          v-model:model="formData.general"
        />
        <ViewerSettings
          v-if="activeTab === 'viewer'"
          v-model:model="formData.viewer"
        />
        <HotKeysSettings
          v-if="activeTab === 'hotkeys'"
          v-model:model="formData.general"
        />
      </div>
    </div>
  </n-spin>

  <SaveDialog
    v-if="showSave"
    @cancel=";(showSave = false), reset()"
    @save="save"
  />
</template>

<script setup lang="ts">
import { NMenu, NSpin } from 'naive-ui'
import SaveDialog from './components/SaveDialog.vue'
import GeneralSettings from './GeneralSettings/GeneralSettings.vue'
import HotKeysSettings from './HotKeysSettings/HotKeysSettings.vue'
import ViewerSettings from './ViewerSettings/ViewerSettings.vue'
import { reactive, ref, computed } from '@vue/reactivity'
import { useElectron } from '/@/use/electron'
import useLocale from '/@/use/locale'
import { onMounted } from '@vue/runtime-core'
import { isEqual } from 'lodash-es'
import { watch } from '@vue/runtime-core'
import { dataClone } from '/@/utils/data'

const { translate, changeLocale } = useLocale()
const { userStore } = useElectron()

const activeTab = ref('general')
const showSave = ref(false)
const loading = ref(false)
const menuOptions = ref()
const formData = reactive({})
const config = ref<any>(null)

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
      key: 'general',
    },
    {
      label: 'Viewer',
      key: 'viewer',
    },
    {
      label: 'HotKeys',
      key: 'hotkeys',
    },
  ]
  menuOptions.value = menu
}

const save = async () => {
  await userStore.set('settings', dataClone(formData))
  await syncUserConfig()
  showSave.value = false
}

const reset = () => {
  const data = config.value
  Object.assign(formData, dataClone(data))
}

const syncUserConfig = async () => {
  const settings = await userStore.get('settings')

  if (!settings)
    await userStore.set('settings', {
      general: {
        locale: 'en',
      },
      viewer: {
        portalPanelPosition: 'right',
      },
    })
  changeLocale(settings.general.locale)

  const cloneSettings = dataClone(settings)
  Object.assign(formData, cloneSettings)
  config.value = cloneSettings
}

onMounted(async () => {
  loading.value = true
  await syncUserConfig()
  generateMenu()
  loading.value = false
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
