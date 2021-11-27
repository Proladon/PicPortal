import { Module } from 'vuex'

const portal: Module<any, any> = {
  state: {
    activedPortals: [],
    dockingProtalMode: 'over',
  },

  mutations: {
    PUSH_ACTIVED_PORTALS: (state, actived) => {
      state.activedPortals.push(actived)
    },
    SPLICE_ACTIVED_PORTALS: (state, index) => {
      state.activedPortals.splice(index, 1)
    },
    RESET_ACTIVED_PORTALS: (state) => {
      state.activedPortals = []
    },
    SET_DOCKING_MODE: (state, mode) => {
      state.dockingProtalMode = mode
    },
  },

  actions: {
    PUSH_ACTIVED_PORTALS: async ({ commit }, data) => {
      commit('PUSH_ACTIVED_PORTALS', data)
    },
    SPLICE_ACTIVED_PORTALS: async ({ commit }, index) => {
      commit('SPLICE_ACTIVED_PORTALS', index)
    },
    RESET_ACTIVED_PORTALS: async ({ commit }) => {
      commit('RESET_ACTIVED_PORTALS')
    },
  },

  getters: {
    activedPortals: (state) => {
      return state.activedPortals
    },
  },
}

export default portal
