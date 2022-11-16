<template>
  <div class="general-settings">
    <n-form>
      <n-form-item :label="translate('settings.general.language')">
        <n-select v-model:value="syncModel.locale" :options="languageOptions" />
      </n-form-item>
      <n-form-item :label="translate('settings.general.theme')">
        <n-select
          v-model:value="syncModel.theme"
          :options="
            map(themes, (theme) => ({ label: theme.label, value: theme.value }))
          "
          :on-update:value="onThemeChange"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NSelect } from 'naive-ui'
import { computed } from 'vue'
import useLocale from '/@/use/locale'
import { localeConfig } from '/@/config/general'
import { themes } from '/@/config/theme'
import { map } from 'lodash-es'
import { useTheme } from '/@/use/theme'

const { setTheme } = useTheme()
const { translate } = useLocale()
const emit = defineEmits(['update:model'])
const props = defineProps({
  model: {
    type: Object,
    default: () => ({}),
  },
})

const syncModel = computed({
  get() {
    return props.model
  },
  set(value) {
    return emit('update:model', value)
  },
})

const languageOptions = computed(() => {
  const list = []
  for (const key in localeConfig) {
    list.push(localeConfig[key])
  }
  return list
})

const onThemeChange = (theme: string) => {
  syncModel.value.theme = theme
  setTheme(theme)
}
</script>

<style scoped lang="postcss"></style>
