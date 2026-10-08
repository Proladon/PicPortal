<template>
  <div class="general-settings viewer-settings flex flex-col gap-8">
    <SettingsSection :title="t('settings.viewer.title')">
      <SettingsRow
        :label="t('settings.viewer.portalPanelPosition')"
        :description="t('settings.viewer.portalPanelPositionDescription')"
      >
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          class="panel-position"
          :model-value="portalPanelPosition"
          @update:model-value="onPositionChange"
        >
          <ToggleGroupItem value="left" class="gap-1.5 px-2.5">
            <PanelLeft />
            {{ t('settings.viewer.left') }}
          </ToggleGroupItem>
          <ToggleGroupItem value="right" class="gap-1.5 px-2.5">
            <PanelRight />
            {{ t('settings.viewer.right') }}
          </ToggleGroupItem>
        </ToggleGroup>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PanelLeft, PanelRight } from '@lucide/vue'
import SettingsRow from '../components/SettingsRow.vue'
import SettingsSection from '../components/SettingsSection.vue'
import { ToggleGroup, ToggleGroupItem } from '/@/components/ui/toggle-group'

const { t } = useI18n()
const emit = defineEmits(['update:model'])
const props = defineProps({
  model: {
    type: Object,
    default: () => ({}),
  },
})

const portalPanelPosition = computed(() => syncModel.value.portalPanelPosition)

const syncModel = computed({
  get() {
    return props.model
  },
  set(value) {
    return emit('update:model', value)
  },
})

const onPositionChange = (position: unknown) => {
  if (position === 'left' || position === 'right')
    syncModel.value.portalPanelPosition = position
}
</script>
