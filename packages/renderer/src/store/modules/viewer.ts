import { Module } from 'vuex'
import { chunk, indexOf, set } from 'lodash'
import { useElectron } from '/@/use/electron'
const { fastGlob, fileSystem } = useElectron()
import { dataClone } from '/@/utils/data'
import PQueue from 'p-queue'
const wrapingQueue = new PQueue({ concurrency: 1 })

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

    WRAPING: async (
      { commit, dispatch },
      { mode, filePath, destPath, dockIndex }
    ) => {
      if (mode === 'copy') {
        const task = async () => {
          const [, err] = await fileSystem.copyFile(filePath, destPath)
          if (err) console.log(err)
          await dispatch('DB_SLICE', {
            key: 'dockings',
            index: dockIndex,
          })
          await dispatch('SYNC_DB_TO_STATE', 'dockings')
        }
        wrapingQueue.add(task)
      }
      if (mode === 'move') {
        const task = async () => {
          const [, err] = await fileSystem.moveFile(filePath, destPath)
          if (err) console.log(err)
          await dispatch('DB_SLICE', {
            key: 'dockings',
            index: dockIndex,
          })
          await dispatch('SYNC_DB_TO_STATE', 'dockings')
        }
        wrapingQueue.add(task)
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
