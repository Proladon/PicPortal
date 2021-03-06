import { defineStore } from 'pinia'
import { useAppStore } from '/@/store/appStore'
import { map, flatten, filter } from 'lodash-es'

interface PortalPaneStoreState {
  activePortals: ActivePortalRef[]
  dockingMode: 'append' | 'override'
  searchPortalName: string
}

export const usePortalPaneStore = defineStore('portalPane', {
  state: (): PortalPaneStoreState => ({
    activePortals: [],
    dockingMode: 'append',
    searchPortalName: ''
  }),
  actions: {
    AddActivedPortal(portal: ActivePortalRef) {
      this.activePortals.push(portal)
    },
    RemoveActivePortal(index: number) {
      this.activePortals.splice(index, 1)
    },
    ResetActivePortal() {
      this.activePortals = []
    },
    SetDockingMode(mode: 'append' | 'override') {
      this.dockingMode = mode
    }
  },
  getters: {
    portals(): PortalGroup[] {
      const appStore = useAppStore()
      if (!appStore.dbData) return []
      return appStore.dbData.portals
    },
    flattenPortals() {
      const portals: any = this.portals
      const childs = map(portals, 'childs')
      const flattenChilds = flatten(childs)
      return flattenChilds
    }
  }
})
