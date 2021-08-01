import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 3rd
import SZUI from 'shelter-zone-ui'
import { createI18n } from 'vue-i18n'
import Settings from 'electron-store'
import VueTablerIcons from 'vue-tabler-icons'

// Styles
import 'windi.css'
import 'shelter-zone-ui/dist/style.css'
import 'splitpanes/dist/splitpanes.css'

// i18n
import messages from './i18n'

import path from 'path'
const __dirname = path.resolve()
console.log('main.ts', __dirname)

const settings = new Settings()

const locale: string = (settings.get('locale') || 'tw') as string

const i18n = createI18n({
  locale,
  fallbackLocale: 'en',
  messages
})

createApp(App)
  .use(store)
  .use(router)
  .use(i18n)
  .use(SZUI)
  .use(VueTablerIcons)
  .mount("#app")
