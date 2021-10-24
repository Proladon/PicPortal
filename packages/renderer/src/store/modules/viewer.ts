import { Module } from 'vuex'
import { chunk, indexOf, set } from 'lodash'
import { useElectron } from '/@/use/electron'
const { fastGlob, fileSystem } = useElectron()
import { dataClone } from '/@/utils/data'

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
    GET_FOLDER_ALL_FILES: async ({ commit, getters }) => {
      const mainFolder = getters.mainFolder.path
      if (!mainFolder) return
      const res = await fastGlob.glob(mainFolder + '/**/*.png')
      commit('SET_FOLDER_FILES', res)
    },

    DOCKING: async ({ dispatch }, { key, data }) => {
      await dispatch('SAVE_TO_DB', {
        key,
        data: dataClone(data),
      })
    },

    WRAPING: async ({ commit }, { mode, filePath, destPath }) => {
      if (mode === 'copy') {
        const [, err] = await fileSystem.copyFile(filePath, destPath)
        if (err) console.log(err)
      }
      if (mode === 'move') {
        const [, err] = await fileSystem.moveFile(filePath, destPath)
        if (err) console.log(err)
      }
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
