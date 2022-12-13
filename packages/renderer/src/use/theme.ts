import { useAppStore } from '/@/store/appStore'
import { GlobalThemeOverrides } from 'naive-ui'

export const useTheme = () => {
  const appStore = useAppStore()
  const getAppTheme = () => document.documentElement.dataset.theme
  const getCssVar = (varKey: string) => {
    const root = getComputedStyle(document.documentElement)
    return root.getPropertyValue(`--${varKey}`).trim()
  }

  const generateNaiveTheme = (): GlobalThemeOverrides => ({
    common: {
      baseColor: getCssVar('base'),
      primaryColor: getCssVar('primary'),
      primaryColorHover: getCssVar('primary'),
      primaryColorPressed: getCssVar('secondary'),
      // hoverColor: getCssVar('primary'),
    },
    Button: {
      borderHover: `1px solid ${getCssVar('primary')}`,

      textColor: getCssVar('base'),
      textColorPrimary: getCssVar('tertiary-bg'),
      textColorHoverPrimary: getCssVar('tertiary-bg'),

      colorHover: getCssVar('primary'),
      textColorHover: getCssVar('dark'),
    },
  })

  const setTheme = (theme: string) => {
    if (!theme) theme = 'picportal'
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
