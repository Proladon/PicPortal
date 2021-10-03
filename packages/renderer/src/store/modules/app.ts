import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()

const app: Module<any, any> = {
  state: {
    project: null,
    mainFolder: {},
    labels: [],
  },

  mutations: {},

  actions: {
    MAIN_FOLDER: async ({ commit }, path) => {
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
    labels: (state) => {
      return state.labels
    },
  },
}

export default app
