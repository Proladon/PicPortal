<template>
  <div class="general-settings">
    <n-form>
      <n-form-item :label="translate('settings.general.language')">
        <n-select v-model:value="syncModel.locale" :options="languageOptions" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NSelect } from 'naive-ui'
import { computed } from 'vue'
import useLocale from '/@/use/locale'
import { localeConfig } from '/@/config/general'

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
</script>

<style scoped lang="postcss"></style>
