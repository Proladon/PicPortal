import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()
import { find } from 'lodash'

const app: Module<any, any> = {
  state: {
    project: null,
    mainFolder: {},
    labels: [],
  },

  mutations: {
    SET_MAIN_FOLDER: (state, path) => {
      state.mainFolder = path
    },
    UPDATE_LABLES: (state, label) => {
      state.labels.push(label)
    },
  },

  actions: {
    MAIN_FOLDER: async ({ commit }, path) => {
      commit('SET_MAIN_FOLDER', path)
      return await database.save('mainFolder', path)
    },
    SYNC_DB: async ({ commit, state }, dbData) => {
      Object.assign(state, dbData)
    },
  },

  getters: {
    mainFolder: (state) => {
      return state.mainFolder
    },
    projectName: (state) => {
      return state.project
    },
  },
}

export default app
