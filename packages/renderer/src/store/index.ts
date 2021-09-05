import { createStore } from 'vuex'
import app from './modules/app'
import viewer from './modules/viewer'

const store = createStore({
  state: {
    tagPane: 'left',
  },
  mutations: {
    EXCHANGE_TAG_PANE_SIDE: (state) => {
      if (state.tagPane === 'left') state.tagPane = 'right'
      else if (state.tagPane === 'right') state.tagPane = 'left'
    },
  },
  actions: {},
  modules: {
    app,
    viewer,
  },
})

export default store
