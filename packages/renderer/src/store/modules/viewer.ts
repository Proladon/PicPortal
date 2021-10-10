import { Module } from 'vuex'
import { chunk, indexOf, set } from 'lodash'
import { useElectron } from '/@/use/electron'
const { fastGlob } = useElectron()
import store from '../index'

const viewer: Module<any, any> = {
  state: {
    loading: false,
    folderFiles: [],
    selectedLabels: [],
  },

  mutations: {
    SET_FOLDER_FILES: (state, files: string[]) => {
      state.folderFiles = files
    },
    UPDATE_SELECTED: (state, item) => {
      const index = indexOf(state.selected, item)
      console.log(index, item)
      if (index !== -1) state.selected.splice(index, 1)
      if (index === -1) {
        console.log('here')
        state.selected.push(item)
      }
    },
  },

  actions: {
    GET_FOLDER_ALL_FILES: async ({ commit }) => {
      const mainFolder = store.getters.mainFolder.path
      if (!mainFolder) return
      const res = await fastGlob.glob(mainFolder + '/**/*.png')
      // const filesChunkList = chunk(res, 3)
      // const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
      commit('SET_FOLDER_FILES', res)
    },
  },

  getters: {
    filesCount: (state) => {
      return state.folderFiles.length
    },
    viewerLoading: (state) => {
      return state.loading
    },
  },
}

export default viewer
