import { createApp } from 'vue'
import App from '/@/App.vue'
import router from './router'
import VueViewer from 'v-viewer'
import 'virtual:windi.css'
import '/@/styles/index.css'
import 'viewerjs/dist/viewer.css'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import messages from '/@/locale'

const i18n = createI18n({
  legacy: false,
  locale: 'tw', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueViewer)
app.use(i18n)
app.mount('#app')
