<template>
  <div class="settings relative flex h-full">
    <aside class="settings-nav flex w-56 shrink-0 flex-col gap-1 border-r p-4">
      <div class="mb-3 px-2">
        <h1 class="text-lg font-semibold tracking-tight">
          {{ t('settings.title') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ t('settings.description') }}
        </p>
      </div>
      <button
        v-for="item in menuOptions"
        :key="item.key"
        type="button"
        class="flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors"
        :class="
          activeTab === item.key
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        "
        :data-key="item.key"
        @click="activeTab = item.key"
      >
        <component :is="item.icon" class="size-4" />
        {{ item.label }}
      </button>
    </aside>

    <div class="min-w-0 flex-1 overflow-y-auto">
      <div v-if="loaded" class="mx-auto max-w-2xl px-8 pt-7 pb-24">
        <GeneralSettings
          v-if="activeTab === 'general'"
          v-model:model="formData.general"
        />
        <ViewerSettings
          v-if="activeTab === 'viewer'"
          v-model:model="formData.viewer"
        />
        <!-- <HotKeysSettings
          v-if="activeTab === 'hotkeys'"
          v-model:model="formData.hotkeys"
        /> -->
      </div>
    </div>

    <div
      v-if="loading"
      class="loading-overlay absolute inset-0 flex items-center justify-center bg-background/60"
    >
      <Spinner class="size-6 text-muted-foreground" />
    </div>

    <SaveDialog
      v-if="showSave"
      @cancel=";(showSave = false), reset()"
      @save="save"
    />
  </div>
</template>

<script setup lang="ts">
import SaveDialog from './components/SaveDialog.vue'
import GeneralSettings from './GeneralSettings/GeneralSettings.vue'
import ViewerSettings from './ViewerSettings/ViewerSettings.vue'
import { reactive, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Images, SlidersHorizontal } from '@lucide/vue'
import { Spinner } from '/@/components/ui/spinner'
import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'
import { createDefaultSettings, getSettings } from '/@/use/settings'
import useLocale from '/@/use/locale'
import { onMounted, onUnmounted } from 'vue'
import { settingsDirty, registerSettingsSave } from '/@/desktop/lifecycle'
import { useViewerStore } from '/@/store/viewerStore'
import { isEqual } from 'lodash-es'
import { watch } from 'vue'
import { dataClone } from '/@/utils/data'
import { useTheme } from '/@/use/theme'

const { applySettings } = useTheme()
const { t } = useI18n()
const { changeLocale } = useLocale()
const { userStore } = useDesktop()

const activeTab = ref('general')
const showSave = ref(false)
const loading = ref(false)
const loaded = ref(false)
const formData = reactive(createDefaultSettings())
const config = ref<any>(null)

watch(
  formData,
  () => {
    if (!loaded.value) return
    if (isEqual(config.value, formData)) showSave.value = false
    else showSave.value = true
    settingsDirty.value = showSave.value
  },
  { deep: true }
)

const menuOptions = computed(() => [
  {
    label: t('settings.general.title'),
    key: 'general',
    icon: SlidersHorizontal,
  },
  { label: t('settings.viewer.title'), key: 'viewer', icon: Images },
])

const save = async () => {
  if (!loaded.value) return
  try {
    await userStore.set('settings', dataClone(formData))
    await syncUserConfig()
    settingsDirty.value = false
    showSave.value = false
  } catch (error) {
    reportDesktopError(error)
    throw error
  }
}

const reset = () => {
  const data = config.value
  Object.assign(formData, dataClone(data))
  applySettings(formData.general)
}

const syncUserConfig = async () => {
  const settings = await getSettings()
  changeLocale(settings.general.locale)
  applySettings(settings.general)

  // const cloneSettings =
  Object.assign(formData, dataClone(settings))
  config.value = dataClone(settings)
  useViewerStore().SET_PORTAL_PANEL_POSITION(
    settings.viewer.portalPanelPosition
  )
}

const unregisterSave = registerSettingsSave(save)
onUnmounted(() => {
  // Leaving without saving drops the live theme preview.
  if (showSave.value && config.value) applySettings(config.value.general)
  unregisterSave()
})

onMounted(async () => {
  loading.value = true
  try {
    await syncUserConfig()
    loaded.value = true
  } catch (error) {
    reportDesktopError(error)
  } finally {
    loading.value = false
  }
})
</script>
