import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()

const app: Module<any, any> = {
  state: {
    project: null,
    mainFolder: {},
    portals: [],
  },

  mutations: {},

  actions: {},

  getters: {
    mainFolder: (state) => {
      return state.mainFolder
    },
    projectName: (state) => {
      return state.project
    },
    portals: (state) => {
      return state.portals
    },
  },
}

export default app
