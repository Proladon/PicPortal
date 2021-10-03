import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()

const app: Module<any, any> = {
  state: {
    project: null,
    mainFolder: {},
    lables: [],
  },

  mutations: {
    SET_MAIN_FOLDER: (state, path) => {
      state.mainFolder = path
    },
    UPDATE_LABLES: (state, label) => {
      state.lables.push(label)
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
    SYNC_DB_STATE: async ({ commit, state }, { key, dbData }) => {
      state[key] = dbData
    },
  },

  getters: {
    mainFolder: (state) => {
      return state.mainFolder
    },
    projectName: (state) => {
      return state.project
    },
    lables: (state) => {
      return state.lables
    },
  },
}

export default app
