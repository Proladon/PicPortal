import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 3rd
import SZUI from 'shelter-zone-ui'
import { createI18n } from 'vue-i18n'
// import Settings from 'electron-store'
import VueTablerIcons from 'vue-tabler-icons'

// Styles
import 'windi.css'
import 'shelter-zone-ui/dist/style.css'
import 'splitpanes/dist/splitpanes.css'

// i18n
import messages from './i18n'

// import path from 'path'
// const __dirname = path.resolve()
// console.log('main.ts', window.ipcRenderer)

// const settings = new Settings()
// const locale: string = (settings.get('locale') || 'tw') as string
window.world.store.set('test', 'test')
console.log('main.ts - window.ipcRenderer:', window)
console.log('test ipc')
window.world.store.get('test').then((result: any) => {
  console.log(result)
}).catch((err: any) => {
  console.log(err)
})
const i18n = createI18n({
  locale: 'tw',
  // locale,
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
