import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()
import { chain } from 'lodash-es'

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
    flattenPortals: (state) => {
      return chain(state.portals).map('childs').flatten().value()
    },
    docking: (state) => {
      return state.docking
    },
  },
}

export default app
