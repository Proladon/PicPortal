import { Module } from 'vuex'

const app: Module<any, any> = {
  state: {
    mainFolder: '',
  },

  mutations: {
    SET_MAIN_FOLDER: (state, folder: object) => {
      state.mainFolder = folder
    },
  },

  actions: {
    // MAIN_FOLDER: ({commit}, path: String) => {
    //   commit('SET_MAIN_FOLDER', path)
    // }
  },

  getters: {
    mainFolder: (state) => {
      return state.mainFolder
    },
  },
}

export default app
