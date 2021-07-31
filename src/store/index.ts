import { createStore } from 'vuex'

export default createStore({
  state: {
    tagPane: 'left'
  },
  mutations: {
    EXCHANGE_TAG_PANE_SIDE: (state) => {
      if (state.tagPane === 'left') state.tagPane = 'right'
      else if (state.tagPane === 'right') state.tagPane = 'left'
    }
  },
  actions: {},
  modules: {}
})
