import { Module } from 'vuex'
import { chunk, indexOf, difference, map } from 'lodash'
import { useElectron } from '/@/use/electron'
const { fastGlob, fileSystem } = useElectron()
import { dataClone } from '/@/utils/data'
import PQueue from 'p-queue'
import store from '/@/store'
const wrapingQueue = new PQueue({ concurrency: 1, autoStart: false })

let count = 0
wrapingQueue.on('active', () => {
  count += 1
  store.commit('UPDATE_WRAPING', count)
})

wrapingQueue.on('idle', async () => {
  count = 0
  await store.dispatch('DB_PULL_DOCKINGS', store.state.viewer.pullList)
  store.commit('UPDATE_WRAPING_STATE', false)
  await store.dispatch('SYNC_DB_TO_STATE', 'dockings')
  wrapingQueue.pause()
})

const viewer: Module<any, any> = {
  state: {
    loading: false,
    folderFiles: [],
    selectedLabels: [],
    wraping: false,
    totalWrap: 0,
    curWrap: 0,
    pullList: [],
    viewerSide: 'left',
  },

  mutations: {
    SET_VIEWER_SIDE: (state, side: string) => {
      console.log(side)
      state.viewerSide = side
    },
    SET_FOLDER_FILES: (state, files: string[]) => {
      state.folderFiles = files
    },
    UPDATE_SELECTED: (state, item) => {
      const index = indexOf(state.selected, item)
      if (index !== -1) state.selected.splice(index, 1)
      if (index === -1) {
        state.selected.push(item)
      }
    },
    UPDATE_PULL_LIST: (state, pullList) => {
      state.pullList = pullList
    },
    PURGE_FILES: (state, purgeList) => {
      const newFileList = difference(state.folderFiles, purgeList)
      state.folderFiles = newFileList
    },
    UPDATE_WRAPING: (state, num) => {
      state.curWrap = num
    },
    UPDATE_WRAPING_STATE: (state, status) => {
      state.wraping = status
    },
    RESET_WRAPING: (state) => {
      state.totalWrap = 0
      state.curWrap = 0
    },
  },

  actions: {
    START_WRAPING: ({ state, commit }) => {
      commit('RESET_WRAPING')
      state.totalWrap = wrapingQueue.size
      state.wraping = true
      wrapingQueue.start()
    },
    GET_FOLDER_ALL_FILES: async ({ commit, getters }) => {
      const mainFolder = getters.mainFolder.path
      if (!mainFolder) return
      const res = await fastGlob.glob(mainFolder + '/**/*.{png,jpg,jpeg}')
      commit('SET_FOLDER_FILES', res)
    },

    DOCKING: async ({ dispatch }, { key, data }) => {
      await dispatch('SAVE_TO_DB', {
        key,
        data: dataClone(data),
      })
    },

    WRAPING: async ({ dispatch }, { mode, filePath, destPath }) => {
      if (mode === 'copy') {
        const task = async () => {
          const [, err] = await fileSystem.copyFile(filePath, destPath)
          if (err) console.log(err)
        }
        wrapingQueue.add(task)
      }
      if (mode === 'move') {
        const task = async () => {
          const [, err] = await fileSystem.moveFile(filePath, destPath)
          if (err) console.log(err)
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
    wrapingProgress: (state) => {
      return state.curWrap / state.totalWrap
    },
  },
}

export default viewer
