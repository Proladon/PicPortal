<template>
  <div class="save-dialog">
    <n-alert :show-icon="false" type="info">
      <div class="flex items-center justify-center gap-[30px]">
        <p>{{ translate('settings.saveWarning') }}</p>
        <div class="flex gap-[10px]">
          <n-button @click="$emit('cancel')">
            {{ translate('common.reset') }}
          </n-button>
          <n-button type="primary" @click="$emit('save')">
            {{ translate('common.save') }}
          </n-button>
        </div>
      </div>
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { NAlert, NButton } from 'naive-ui/es'
import useLocale from '/@/use/locale'

defineEmits(['cancel', 'save'])
const { translate } = useLocale()
</script>

<style lang="postcss" scoped>
.save-dialog {
  @apply fixed bottom-[50px] left-0 right-0;
  @apply flex justify-center items-center;
}
</style>
