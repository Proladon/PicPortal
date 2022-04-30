import { defineStore } from 'pinia'
import { useElectron } from '/@/use/electron'
import { useAppStore } from '/@/store/appStore'
const { fastGlob, fileSystem } = useElectron()

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
    pullList: []
  }),
  actions: {
    SET_PORTAL_PANEL_POSITION(position: 'left' | 'right') {
      this.portalPanelPosition = position
    },
    SET_LAST_VIEWER_TYPE(type: ViewerTypes) {
      this.lastViewerType = type
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
    }
  },
  getters: {
    folderFilesCount(): number {
      return this.folderFiles.length
    },
    dockings(): Docking[] {
      const appStore = useAppStore()
      if (!appStore.dbData) return []
      return appStore.dbData.dockings
    }
  }
})
