import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()

const app: Module<any, any> = {
  state: {
    mainFolder: '',
    labels: [],
  },

  mutations: {
    SET_MAIN_FOLDER: (state, path) => {
      state.mainFolder = path
    },
  },

  actions: {
    MAIN_FOLDER: async ({ commit }, path) => {
      commit('SET_MAIN_FOLDER', path)
      return await database.save('mainFolder', path)
    },
  },

  getters: {
    mainFolder: (state) => {
      return state.mainFolder
    },
  },
}

export default app
