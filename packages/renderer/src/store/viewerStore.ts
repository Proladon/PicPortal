import { defineStore } from 'pinia'
import { useElectron } from '/@/use/electron'
import { useAppStore } from '/@/store/appStore'
import { difference, map, filter, intersection } from 'lodash'
const { fastGlob, fileSystem } = useElectron()
import { wrapingQueue, filesExistQueue } from '/@/queue'
import PQueue from 'p-queue'

export type ViewerTypes =
  | 'GridView'
  | 'ListView'
  | 'VirtualList'
  | 'VirtualGrid'
export type PortalPanelPosition = 'left' | 'right'

interface ViewerStoreState {
  loading: boolean
  signal: {
    refresh: boolean
  }
  lastViewerType: ViewerTypes
  portalPanelPosition: PortalPanelPosition
  folderFiles: any[]
  activePortal: any[]
  wrap: {
    wraping: boolean
    totalWrap: number
    curWrap: number
    errWrap: number
    filesExist: any[]
    sameOperation: {
      enable: boolean
      action: null | 'skip' | 'plusNum' | 'delete' | 'override'
    }
  }
  pullList: any[]
  filter: {
    onlyDockings: boolean
    portals: string[]
    fileTypes: string[]
  }
  gridView: {
    perPage: number
    imgSize: number
  }
}

export const useViewerStore = defineStore('viewer', {
  state: (): ViewerStoreState => ({
    loading: false, // viewer loading
    signal: {
      refresh: false,
    },
    lastViewerType: 'GridView',
    portalPanelPosition: 'right',
    folderFiles: [],
    activePortal: [],
    wrap: {
      wraping: false,
      totalWrap: 0,
      curWrap: 0,
      errWrap: 0,
      filesExist: [],
      sameOperation: {
        enable: false,
        action: null,
      },
    },
    pullList: [], // files need to pull after portal
    filter: {
      onlyDockings: false,
      portals: [],
      fileTypes: [],
    },
    gridView: {
      perPage: 20,
      imgSize: 150,
    },
  }),
  actions: {
    SET_PORTAL_PANEL_POSITION(position: 'left' | 'right') {
      this.portalPanelPosition = position
    },
    SET_LAST_VIEWER_TYPE(type: ViewerTypes) {
      this.lastViewerType = type
    },
    UpdatePullList(pullList: any[]) {
      this.pullList = pullList
    },
    async GetFolderAllFiles({ fileTypes }: { fileTypes?: string[] }) {
      const appStore = useAppStore()
      let mainFolderPath = appStore.projectMainFolder.path
      if (!mainFolderPath) {
        this.folderFiles = []
        return
      }
      if (!fileTypes) fileTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp']

      mainFolderPath = mainFolderPath.replaceAll('(', '\\(')
      mainFolderPath = mainFolderPath.replaceAll(')', '\\)')

      let pathPattern
      if (fileTypes.length === 1)
        pathPattern = `${mainFolderPath}/**/*.${fileTypes[0]}`
      else if (fileTypes.length > 2)
        pathPattern = `${mainFolderPath}/**/*.{${fileTypes.join(',')}}`

      const files = await fastGlob.glob(pathPattern)

      this.folderFiles = files
    },
    async ClearDockings() {
      const appStore = useAppStore()
      await appStore.SaveToDB({ key: 'dockings', data: [] })
      await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
    },
    async PurgeFiles(purgeList: any[]) {
      const newFileList = difference(this.folderFiles, purgeList)
      this.folderFiles = newFileList
    },
    async Wraping({
      mode,
      filePath,
      destPath,
    }: {
      mode: 'copy' | 'move'
      filePath: string
      destPath: string
    }) {
      const task = async (mode: 'move' | 'copy') => {
        const func = mode === 'copy' ? 'copyFile' : 'moveFile'
        const [, err] = await fileSystem[func](filePath, destPath)
        if (err) {
          if (err === 'FILE_EXIST')
            this.wrap.filesExist.push({
              mode: mode,
              filePath,
              destPath,
            })
          return Promise.reject(new Error(err))
        }
      }

      if (mode === 'copy') wrapingQueue.add(() => task('copy'))
      if (mode === 'move') wrapingQueue.add(() => task('move'))
    },
    PushToFileExistQueue(task: any) {
      filesExistQueue.add(task)
    },
    StartWraping(type: 'normal' | 'fileExist') {
      let usingQueue = wrapingQueue
      if (type === 'fileExist') usingQueue = filesExistQueue
      this.wrap.totalWrap = 0
      this.wrap.curWrap = 0
      this.wrap.errWrap = 0
      this.wrap.totalWrap = usingQueue.size
      this.wrap.wraping = true
      this.wrap.sameOperation.enable = false
      this.wrap.sameOperation.action = null
      usingQueue.start()
    },
  },
  getters: {
    folderFilesCount(): number {
      return this.folderFiles.length
    },
    showFilesCount(): number {
      return this.showFiles.length
    },
    // files with filters
    showFiles(): string[] {
      let dockings = this.dockings
      let files = this.folderFiles
      if (this.filter.fileTypes.length) {
        if (this.filter.onlyDockings) {
          dockings = filter(dockings, (docking) => {
            const extensions = docking.target.split('.').pop()
            return this.filter.fileTypes.includes(extensions) || false
          })
        } else {
          files = filter(files, (file) => {
            const extensions = file.split('.').pop()
            return this.filter.fileTypes.includes(extensions) || false
          })
        }
      }
      if (this.filter.portals.length) {
        dockings = filter(dockings, (docking) => {
          const res = intersection(docking.portals, this.filter.portals)
          if (res.length) return docking
          return false
        })
      }
      if (this.filter.onlyDockings) {
        const res = map(
          filter(dockings, (i: any) => i.portals.length),
          'target'
        )
        return res
      }
      return files
    },
    dockings(): Docking[] {
      const appStore = useAppStore()
      if (!appStore.dbData) return []
      return appStore.dbData.dockings
    },
  },
})

let count = 0
wrapingQueue.on('completed', () => {
  count += 1
  const viewerStore = useViewerStore()
  viewerStore.wrap.curWrap = count
})

wrapingQueue.on('idle', async () => {
  count = 0
  const viewerStore = useViewerStore()
  const appStore = useAppStore()
  await appStore.DBPullDockings(viewerStore.pullList)
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  wrapingQueue.pause()
  viewerStore.wrap.wraping = false
  viewerStore.signal.refresh = true
})

wrapingQueue.on('error', (error) => {
  console.error('queue error', error)
  const viewerStore = useViewerStore()
  viewerStore.wrap.errWrap += 1
})

let fileExistCount = 0
filesExistQueue.on('completed', () => {
  fileExistCount += 1
  const viewerStore = useViewerStore()
  viewerStore.wrap.curWrap = fileExistCount
})

filesExistQueue.on('idle', async () => {
  fileExistCount = 0
  const viewerStore = useViewerStore()
  const appStore = useAppStore()
  await appStore.DBPullDockings(viewerStore.pullList)
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  filesExistQueue.pause()
  viewerStore.wrap.wraping = false
  viewerStore.signal.refresh = true
})
