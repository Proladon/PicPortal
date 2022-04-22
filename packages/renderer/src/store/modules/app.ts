import { Module } from 'vuex'
import { useElectron } from '/@/use/electron'
const { database } = useElectron()
import { map, flatten } from 'lodash-es'
import path from 'path'

const app: Module<any, any> = {
  state: {
    project: null,
    mainFolder: {},
    portals: [],
    dockings: []
  },

  mutations: {},

  actions: {},

  getters: {
    mainFolder: (state) => {
      return state.mainFolder
    },
    projectName: (state) => {
      return state.project ? path.basename(state.project) : ''
    },
    portals: (state) => {
      return state.portals
    },
    flattenPortals: (state) => {
      const childs = map(state.portals, 'childs')
      const flattenChilds = flatten(childs)
      return flattenChilds
    },
    dockings: (state) => {
      return state.dockings
    }
  }
}

export default app
