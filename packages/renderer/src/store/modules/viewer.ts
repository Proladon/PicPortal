import { Module } from 'vuex'
import { chunk, indexOf, set } from 'lodash'
import { useElectron } from '/@/use/electron'
const { fastGlob } = useElectron()
import store from '../index'

const viewer: Module<any, any> = {
  state: {
    folderFiles: [],
    selected: [],
  },

  mutations: {
    SET_FOLDER_FILES: (state, files: String[]) => {
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
      const res = await fastGlob.glob(
        store.getters.mainFolder.path + '/**/*.png'
      )
      // const filesChunkList = chunk(res, 3)
      // const newData = filesChunkList.map((chunk: unknown) => ({ src: chunk }))
      commit('SET_FOLDER_FILES', res)
    },
  },

  getters: {},
}

export default viewer