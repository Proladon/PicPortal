import { defineStore } from 'pinia'
import { useElectron } from '/@/use/electron'
import { useAppStore } from '/@/store/appStore'
import { chunk, indexOf, difference, map, filter, intersection } from 'lodash'
const { fastGlob, fileSystem } = useElectron()
import { wrapingQueue } from '/@/queue'

export type ViewerTypes =
  | 'GridView'
  | 'ListView'
  | 'VirtualList'
  | 'VirtualGrid'
export type PortalPanelPosition = 'left' | 'right'

interface ViewerStoreState {
  loading: boolean
  lastViewerType: ViewerTypes
  portalPanelPosition: PortalPanelPosition
  folderFiles: any[]
  activePortal: any[]
  wrap: {
    wraping: boolean
    totalWrap: number
    curWrap: number
    errWrap: number
  }
  pullList: any[]
  filter: {
    onlyDockings: boolean
    portals: string[]
    fileTypes: string[]
  }
}

export const useViewerStore = defineStore('viewer', {
  state: (): ViewerStoreState => ({
    loading: false,
    lastViewerType: 'GridView',
    portalPanelPosition: 'right',
    folderFiles: [],
    activePortal: [],
    wrap: {
      wraping: false,
      totalWrap: 0,
      curWrap: 0,
      errWrap: 0
    },
    pullList: [],
    filter: {
      onlyDockings: false,
      portals: [],
      fileTypes: []
    }
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
      const mainFolderPath = appStore.projectMainFolder.path
      if (!mainFolderPath) return
      if (!fileTypes) fileTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp']

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
      destPath
    }: {
      mode: 'copy' | 'move'
      filePath: string
      destPath: string
    }) {
      if (mode === 'copy') {
        const task = async () => {
          const [, err] = await fileSystem.copyFile(filePath, destPath)
          if (err) {
            console.log('copy', err)
            return Promise.reject(new Error(err))
          }
        }
        wrapingQueue.add(task)
      }
      if (mode === 'move') {
        const task = async () => {
          const [, err] = await fileSystem.moveFile(filePath, destPath)
          if (err) {
            console.log('move', err)
            return Promise.reject(new Error(err))
          }
        }
        wrapingQueue.add(task)
      }
    },
    StartWraping() {
      this.wrap.totalWrap = 0
      this.wrap.curWrap = 0
      this.wrap.errWrap = 0
      this.wrap.totalWrap = wrapingQueue.size
      this.wrap.wraping = true
      wrapingQueue.start()
    }
  },
  getters: {
    folderFilesCount(): number {
      return this.folderFiles.length
    },
    showFilesCount(): number {
      return this.showFiles.length
    },
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
    }
  }
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
  viewerStore.wrap.wraping = false
  await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
  wrapingQueue.pause()
})

wrapingQueue.on('error', (error) => {
  console.error('queue error', error)
  const viewerStore = useViewerStore()
  viewerStore.wrap.errWrap += 1
})
