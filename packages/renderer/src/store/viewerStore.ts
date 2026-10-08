import { defineStore } from 'pinia'
import { useDesktop } from '/@/desktop'
import { useAppStore } from '/@/store/appStore'
import { map, filter, intersection } from 'lodash'
const { scanner } = useDesktop()
import { wrapingQueue } from '/@/queue'
import { processBatchItem, BatchItem, ConflictAction, ConflictDecision } from '/@/desktop/batch'
import { filePathKey } from '/@/utils/file'
import { reportDesktopError } from '/@/desktop/status'
let scanRequest = 0
let conflictId = 0
let resolveConflict: ((decision: ConflictDecision) => void) | undefined

export type ViewerTypes =
  | 'GridView'
  | 'ListView'
  | 'VirtualList'
  | 'VirtualGrid'
  | 'FocusView'
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
    skipWrap: number
    filesExist: any[]
    sameOperation: {
      enable: boolean
      action: null | 'skip' | 'plusNum' | 'delete' | 'override'
    }
  }
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
      refresh: false
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
      skipWrap: 0,
      filesExist: [],
      sameOperation: {
        enable: false,
        action: null
      }
    },
    filter: {
      onlyDockings: false,
      portals: [],
      fileTypes: []
    },
    gridView: {
      perPage: 20,
      imgSize: 150
    }
  }),
  actions: {
    SET_PORTAL_PANEL_POSITION(position: 'left' | 'right') {
      this.portalPanelPosition = position
    },
    SET_LAST_VIEWER_TYPE(type: ViewerTypes) {
      this.lastViewerType = type
    },
    async GetFolderAllFiles({ fileTypes }: { fileTypes?: string[] }) {
      const request = ++scanRequest
      const appStore = useAppStore()
      const project = appStore.openProject?.path
      const mainFolderPath = appStore.projectMainFolder.path
      if (!mainFolderPath) {
        this.folderFiles = []
        return
      }
      if (!fileTypes) fileTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp']

      try {
        const files = await scanner.scanImages(mainFolderPath, fileTypes)
        if (
          request === scanRequest &&
          project === appStore.openProject?.path &&
          mainFolderPath === appStore.projectMainFolder.path
        )
          this.folderFiles = files
      } catch (error) {
        if (request === scanRequest) {
          this.folderFiles = []
          reportDesktopError(error)
        }
      }
    },
    async ClearDockings() {
      const appStore = useAppStore()
      await appStore.SaveToDB({ key: 'dockings', data: [] })
      await appStore.SyncDBDataToState({ syncKeys: ['dockings'] })
    },
    async StartBatch(items: BatchItem[]) {
      if (this.wrap.wraping || !items.length) return
      const bound = useDesktop().captureProject()
      const appStore = useAppStore()
      const project = appStore.openProject?.path
      const isCurrent = () => project === appStore.openProject?.path
      Object.assign(this.wrap, {
        wraping: true, totalWrap: items.length, curWrap: 0,
        errWrap: 0, skipWrap: 0, filesExist: [],
        sameOperation: { enable: false, action: null }
      })
      const job = wrapingQueue.add(async () => {
        for (const item of items) {
          try {
            const result = await processBatchItem(item, bound, (data) => {
              if (this.wrap.sameOperation.enable && this.wrap.sameOperation.action)
                return Promise.resolve({ action: this.wrap.sameOperation.action })
              this.wrap.filesExist = [{ ...data, id: ++conflictId }]
              return new Promise<ConflictDecision>((resolve) => { resolveConflict = resolve })
            }, isCurrent)
            if (result === 'skip') this.wrap.skipWrap++
            else this.wrap.curWrap++
          } catch (error) {
            this.wrap.errWrap++
            reportDesktopError(error)
          }
        }
      })
      wrapingQueue.start()
      try { await job } finally {
        wrapingQueue.pause()
        resolveConflict = undefined
        this.wrap.filesExist = []
        if (isCurrent()) {
          const [dockings, error] = await bound.database.get('dockings')
          if (error) reportDesktopError(error)
          else if (appStore.dbData) appStore.dbData.dockings = dockings as Docking[]
          await this.GetFolderAllFiles({})
        }
        this.wrap.wraping = false
        this.signal.refresh = true
      }
    },
    ResolveConflict(id: number, action: ConflictAction, name?: string) {
      if (this.wrap.filesExist[0]?.id !== id || !resolveConflict) return
      if (this.wrap.sameOperation.enable && action !== 'rename') this.wrap.sameOperation.action = action
      const resolve = resolveConflict
      resolveConflict = undefined
      this.wrap.filesExist = []
      resolve({ action, name })
    }
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
            const extensions = docking.target.split('.').pop()?.toLowerCase()
            return this.filter.fileTypes.includes(extensions || '')
          })
        } else {
          files = filter(files, (file) => {
            const extensions = file.split('.').pop()?.toLowerCase()
            return this.filter.fileTypes.includes(extensions) || false
          })
        }
      }
      if (this.filter.portals.length) {
        dockings = dockings.filter((docking) => {
          const res = intersection(docking.portals, this.filter.portals)
          return res.length > 0
        })
      }
      if (this.filter.onlyDockings) {
        const res = map(
          filter(dockings, (i: any) => i.portals.length),
          'target'
        )
        const scanned = new Map<string, string>(
          files.map((file: string) => [filePathKey(file), file])
        )
        return res.flatMap((target: string) =>
          scanned.get(filePathKey(target))
            ? [scanned.get(filePathKey(target))!]
            : []
        )
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
