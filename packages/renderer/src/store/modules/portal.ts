import { Module } from 'vuex'

const portal: Module<any, any> = {
  state: {
    expandedPortals: [],
    activedPortals: [],
  },

  mutations: {
    PUSH_EXPANDED_PORTALS: (state, expanded) => {
      state.expandedPortals.push(expanded)
    },
    SPLICE_EXPANDED_PORTALS: (state, index) => {
      state.expandedPortals.splice(index, 1)
    },

    PUSH_ACTIVED_PORTALS: (state, actived) => {
      state.activedPortals.push(actived)
    },
    SPLICE_ACTIVED_PORTALS: (state, index) => {
      state.activedPortals.splice(index, 1)
    },
  },

  actions: {
    PUSH_EXPANDED_PORTALS: async ({ commit }, data) => {
      commit('PUSH_EXPANDED_PORTALS', data)
    },
    SPLICE_EXPANDED_PORTALS: async ({ commit }, index) => {
      commit('SPLICE_EXPANDED_PORTALS', index)
    },

    PUSH_ACTIVED_PORTALS: async ({ commit }, data) => {
      commit('PUSH_ACTIVED_PORTALS', data)
    },
    SPLICE_ACTIVED_PORTALS: async ({ commit }, index) => {
      commit('SPLICE_ACTIVED_PORTALS', index)
    },
  },

  getters: {
    expandedPortals: (state) => {
      return state.expandedPortals
    },
    activedPortals: (state) => {
      return state.activedPortals
    },
  },
}

export default portal
