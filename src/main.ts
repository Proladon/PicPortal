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

window.world.store.get('locale').then((res: string | null)=> {
  let locale = res
  
  if(! locale) {
    locale = 'tw'
    window.world.store.set('locale', locale)
  }

  console.log(locale)

  const i18n = createI18n({
    // locale: 'tw',
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

})
