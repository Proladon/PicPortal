export const useTheme = () => {
  const setTheme = (theme: string) => {
    document.documentElement.dataset.theme = theme
  }
  const defaultTheme = () => {
    document.documentElement.dataset.theme = 'picportal'
  }

  return {
    setTheme,
    defaultTheme,
  }
}
