import { createApp } from 'vue'
import App from '/@/App.vue'
import router from './router'
import store from './store'
import VueViewer from 'v-viewer'
import 'virtual:windi.css'
import '/@/styles/index.css'
import 'gitart-vue-dialog/dist/style.css'
import 'viewerjs/dist/viewer.css'
import { createPinia } from 'pinia'
createApp(App)
  .use(createPinia())
  .use(router)
  .use(store)
  .use(VueViewer)
  .mount('#app')
