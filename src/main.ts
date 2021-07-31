import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"
import "windi.css"
import SZUI from 'shelter-zone-ui'
import 'shelter-zone-ui/dist/style.css'
import 'splitpanes/dist/splitpanes.css'
import VueTablerIcons from "vue-tabler-icons"



createApp(App)
.use(store)
.use(router)
.use(SZUI)
.use(VueTablerIcons)
.mount("#app")
