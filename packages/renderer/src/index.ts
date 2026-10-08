import { createApp } from 'vue'
import App from '/@/App.vue'
import router from './router'
import VueViewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
import '/@/styles/index.css'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import messages from '/@/locale'
import { useDesktop } from './desktop'
import { reportDesktopError } from './desktop/status'

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
app.config.errorHandler = reportDesktopError
useDesktop().initialize().then(() => app.mount('#app')).catch((error) => {
  const root = document.getElementById('app')
  if (root) root.textContent = `桌面初始化失敗：${String(error)}`
})
