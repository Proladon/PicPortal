import { ref } from 'vue'
import {
  defaultAccentTheme,
  defaultAppearance,
  isAccentTheme,
  isAppearance,
} from '/@/config/theme'
import type { AccentTheme, Appearance } from '/@/config/theme'

const appearance = ref<Appearance>(defaultAppearance)
const accent = ref<AccentTheme>(defaultAccentTheme)
/** Whether the dark palette is currently applied (resolves `system`). */
const isDark = ref(true)
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

const applyAppearance = () => {
  const dark =
    appearance.value === 'system'
      ? systemDark.matches
      : appearance.value === 'dark'
  isDark.value = dark
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

systemDark.addEventListener('change', () => {
  if (appearance.value === 'system') applyAppearance()
})

export const useTheme = () => {
  /** Apply an accent palette (`settings.general.theme`). */
  const setTheme = (theme?: string) => {
    accent.value = isAccentTheme(theme) ? theme : defaultAccentTheme
    document.documentElement.dataset.accent = accent.value
  }

  /** Apply dark / light / system (`settings.general.appearance`). */
  const setAppearance = (mode?: string) => {
    appearance.value = isAppearance(mode) ? mode : defaultAppearance
    applyAppearance()
  }

  const applySettings = (general?: { theme?: string; appearance?: string }) => {
    setTheme(general?.theme)
    setAppearance(general?.appearance)
  }

  return {
    accent,
    appearance,
    isDark,
    setTheme,
    setAppearance,
    applySettings,
  }
}
