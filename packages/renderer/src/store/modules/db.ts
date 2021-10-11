import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()
import PQueue from 'p-queue'
const queue = new PQueue({ concurrency: 1 })

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
      const start = performance.now()
      const stringData = JSON.stringify(data)
      const end = performance.now()
      console.log(`stringify: ${(end - start) / 1000} 秒`)
      return await database.save(key, stringData)
    },
    DEEP_SAVE_TO_DB: async ({ commit }, { keys, data }) => {
      const stringData = JSON.stringify(data)
      const task = async () => await database.deepSave(keys, stringData)
      await queue.add(task)
    },
    DB_GET: async ({ commit }, key: string) => {
      return await database.get(key)
    },
    SYNC_DB_TO_STATE: async ({ rootState }, key) => {
      const start = performance.now()
      const [getRes, getError] = await database.get(key)
      const end = performance.now()
      console.log(`read: ${(end - start) / 1000} 秒`)
      if (getError) return alert(getError)
      rootState.app[key] = getRes
    },
    SYNC_DB: async ({ commit, rootState }, dbData) => {
      Object.assign(rootState.app, dbData)
    },
  },
}

export default db
