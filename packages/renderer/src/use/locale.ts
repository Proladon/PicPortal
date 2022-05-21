import { useI18n } from 'vue-i18n'
import { get } from 'lodash-es'

export default () => {
  const { messages, locale } = useI18n()

  const translate = (path: string, defaultString = '') => {
    const localeMessages = (messages as any).value?.[locale.value]
    return get(localeMessages, path, defaultString)
  }

  const changeLocale = (newLocale: string) => {
    locale.value = newLocale
  }

  return {
    translate,
    messages,
    locale,
    changeLocale
  }
}
