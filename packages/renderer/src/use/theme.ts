import { computed, reactive, ref, watch } from 'vue'
import { useAppStore } from '/@/store/appStore'
import { GlobalThemeOverrides } from 'naive-ui'

export const useTheme = () => {
  const appStore = useAppStore()
  const getAppTheme = () => document.documentElement.dataset.theme

  const _root = computed(() => getComputedStyle(document.documentElement))

  const getCssVar = (varKey: string) => {
    const root = getComputedStyle(document.documentElement)
    return root.getPropertyValue(`--${varKey}`).trim()
  }

  const generateNaiveTheme = (): GlobalThemeOverrides => ({
    common: {
      primaryColor: getCssVar('secondary'),
      hoverColor: getCssVar('secondary'),
    },
    Button: {
      borderHover: getCssVar('secondary'),
      textColor: getCssVar('base'),
      colorHover: getCssVar('secondary'),
      textColorHover: getCssVar('dark'),
    },
  })

  const setTheme = (theme: string) => {
    document.documentElement.dataset.theme = theme
    appStore.theme = generateNaiveTheme()
  }
  const defaultTheme = () => {
    document.documentElement.dataset.theme = 'picportal'
    appStore.theme = generateNaiveTheme()
  }

  return {
    getAppTheme,
    getCssVar,
    setTheme,
    defaultTheme,
    generateNaiveTheme,
  }
}
