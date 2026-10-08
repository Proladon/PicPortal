<template>
  <div class="general-settings flex flex-col gap-8">
    <SettingsSection :title="t('settings.general.title')">
      <SettingsRow
        :label="t('settings.general.language')"
        :description="t('settings.general.languageDescription')"
      >
        <Select v-model="syncModel.locale">
          <SelectTrigger class="language-select w-44" size="sm">
            <Languages class="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in languageOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        :label="t('settings.general.appearance')"
        :description="t('settings.general.appearanceDescription')"
      >
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          class="appearance-select"
          :model-value="syncModel.appearance || defaultAppearance"
          @update:model-value="onAppearanceChange"
        >
          <ToggleGroupItem
            v-for="mode in appearanceOptions"
            :key="mode.value"
            :value="mode.value"
            class="gap-1.5 px-2.5"
          >
            <component :is="mode.icon" />
            {{ t(`settings.general.appearances.${mode.value}`) }}
          </ToggleGroupItem>
        </ToggleGroup>
      </SettingsRow>

      <SettingsRow
        :label="t('settings.general.theme')"
        :description="t('settings.general.themeDescription')"
      >
        <div class="theme-select flex flex-wrap gap-2" role="radiogroup">
          <Tooltip v-for="theme in accentThemes" :key="theme.value">
            <TooltipTrigger as-child>
              <button
                type="button"
                role="radio"
                class="relative flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
                :class="{
                  'ring-2 ring-foreground/70': currentTheme === theme.value,
                }"
                :style="{ background: theme.swatch }"
                :aria-checked="currentTheme === theme.value"
                :aria-label="t(`settings.general.accents.${theme.value}`)"
                :data-value="theme.value"
                @click="onThemeChange(theme.value)"
              >
                <Check
                  v-if="currentTheme === theme.value"
                  class="size-3.5 text-white drop-shadow-[0_0_1.5px_rgb(0_0_0/0.9)]"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{{
              t(`settings.general.accents.${theme.value}`)
            }}</TooltipContent>
          </Tooltip>
        </div>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Languages, Monitor, Moon, Sun } from '@lucide/vue'
import SettingsRow from '../components/SettingsRow.vue'
import SettingsSection from '../components/SettingsSection.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '/@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '/@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '/@/components/ui/tooltip'
import { localeConfig } from '/@/config/general'
import {
  accentThemes,
  defaultAccentTheme,
  defaultAppearance,
  isAccentTheme,
  isAppearance,
} from '/@/config/theme'
import { useTheme } from '/@/use/theme'

const { setTheme, setAppearance } = useTheme()
const { t } = useI18n()
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
  return Object.values(localeConfig)
})

const appearanceOptions = [
  { value: 'dark', icon: Moon },
  { value: 'light', icon: Sun },
  { value: 'system', icon: Monitor },
]

const currentTheme = computed(() =>
  isAccentTheme(syncModel.value.theme)
    ? syncModel.value.theme
    : defaultAccentTheme
)

const onThemeChange = (theme: string) => {
  syncModel.value.theme = theme
  setTheme(theme)
}

const onAppearanceChange = (mode: unknown) => {
  if (!isAppearance(mode)) return
  syncModel.value.appearance = mode
  setAppearance(mode)
}
</script>
