import { defineStore } from 'pinia'

export type ViewerTypes =
  | 'GridView'
  | 'ListView'
  | 'VirtualList'
  | 'VirtualGrid'
export type PortalPanelPosition = 'left' | 'right'

interface ViewerStoreState {
  lastViewerType: ViewerTypes
  portalPanelPosition: PortalPanelPosition
}

export const useViewerStore = defineStore('viewer', {
  state: (): ViewerStoreState => ({
    lastViewerType: 'GridView',
    portalPanelPosition: 'right'
  }),
  actions: {
    SET_PORTAL_PANEL_POSITION(position: 'left' | 'right') {
      this.portalPanelPosition = position
    },
    SET_LAST_VIEWER_TYPE(type: ViewerTypes) {
      this.lastViewerType = type
    }
  }
})
