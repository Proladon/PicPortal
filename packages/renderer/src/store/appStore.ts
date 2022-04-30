import { defineStore } from 'pinia'
import { useElectron } from '/@/use/electron'
import { map } from 'lodash-es'
const { database } = useElectron()
import PQueue from 'p-queue'
export const DBQueue = new PQueue({ concurrency: 1 })

type Project = {
  id: string
  name: string
  path: string
  color: string
}
type MainFolder = {
  name: string
  path: string
}
type PortalChild = {
  id: string
  name: string
  link: string
  bg: string
  fg: string
}
type Portals = {
  childs: PortalChild[]
  group: string
  id: string
}
type DBData = {
  project: string
  portals: Portals[]
  dockings: any[]
  mainFolder: MainFolder
}

interface AppStoreState {
  openProject: null | Project
  dbData: null | DBData
}

export const useAppStore = defineStore('app', {
  state: (): AppStoreState => ({
    openProject: null,
    dbData: null
  }),
  actions: {
    SetOpenProject(project: Project) {
      this.openProject = project
    },
    async ConnectProjectDB(): Promise<any[]> {
      if (this.openProject) {
        return await database.connect(this.openProject.path)
      }
      return [null, 'No project open']
    },
    async SaveToDB({ key, data }: { key: string; data: any }) {
      // const start = performance.now()
      const stringData = JSON.stringify(data)
      // const end = performance.now()
      // console.log(`stringify: ${(end - start) / 1000} 秒`)
      return await database.save(key, stringData)
    },
    async DeepSaveToDB({ key, data }: { key: string; data: any }) {
      const stringData = JSON.stringify(data)
      const task = async () => await database.deepSave(key, stringData)
      await DBQueue.add(task)
    },
    async DBSlice({ key, index }: { key: string; index: number }) {
      const task = async () => await database.slice(key, index)
      await DBQueue.add(task)
    },
    DBGet: async ({ key }: { key: string }) => {
      return await database.get(key)
    },
    /** 移除掉已被 warp 掉的 docking 項目 */
    DBPullDockings: async (pullList: string[]) => {
      const stringData = JSON.stringify(
        map(pullList, (item) => ({ target: item }))
      )
      return await database.pullDockings(stringData)
    },

    /** 同步DB資料 */
    async SyncDBData({ dbData }: { dbData: any }) {
      this.dbData = dbData
    },

    async SyncDBDataToState({
      syncKeys
    }: {
      syncKeys: Array<'project' | 'portals' | 'mainFolder' | 'dockings'>
    }) {
      if (!this.dbData) return
      for (const key of syncKeys) {
        const [getRes, getError] = await database.get(key)
        if (getError) return alert(getError)
        this.dbData[key] = getRes
      }
    }
  },
  getters: {
    projectName(): string {
      return this.openProject?.name || ''
    },
    projectMainFolder(): MainFolder | Record<string, never> {
      return this.dbData?.mainFolder || {}
    }
  }
})
