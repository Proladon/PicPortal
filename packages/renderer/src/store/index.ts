import { createStore } from 'vuex'
import app from './modules/app'
import viewer from './modules/viewer'
import db from './modules/db'
import portal from './modules/portal'

const store = createStore({
  modules: {
    app,
    viewer,
    db,
    portal
  }
})

export default store
