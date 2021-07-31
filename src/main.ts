import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"
import "windi.css"
import SZUI from 'shelter-zone-ui'
import 'shelter-zone-ui/dist/style.css'
import 'splitpanes/dist/splitpanes.css'


createApp(App)
  .use(store)
  .use(router)
  .use(SZUI)
  .mount("#app")
