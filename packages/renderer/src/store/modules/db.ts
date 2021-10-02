import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()

const db: Module<any, any> = {
  state: {
    projectPath: '',
  },

  mutations: {
    SET_PROJECT_PATH: (state, path: string) => {
      state.projectPath = path
    },
  },

  actions: {
    PROJECT_PATH: async ({ commit }, path: string) => {
      commit('SET_PROJECT_PATH', path)
    },
    CONNECT_DB: async ({ commit, state }) => {
      return await database.connect(state.projectPath)
    },
    SAVE_TO_DB: async ({ commit }, { key, data }) => {
      return await database.save({
        key,
        data,
      })
    },
    DB_GET: async ({ commit }, key: string) => {
      return await database.get(key)
    },
  },
}

export default db
