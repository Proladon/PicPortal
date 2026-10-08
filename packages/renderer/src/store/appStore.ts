import { defineStore } from 'pinia'
import { useDesktop } from '/@/desktop'
import { map } from 'lodash-es'
const { database } = useDesktop()
import PQueue from 'p-queue'
import { reportDesktopError } from '/@/desktop/status'
import type { DesktopResult } from '/@/desktop/types'
import { useViewerStore } from './viewerStore'
export const DBQueue = new PQueue({ concurrency: 1 })

interface AppStoreState {
  openProject: null | Project
  dbData: null | DBData
  sourceFolder: MainFolder | null
  commander: {
    portal: boolean
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppStoreState => ({
    openProject: null,
    dbData: null,
    sourceFolder: null,
    commander: {
      portal: false
    }
  }),
  actions: {
    SetOpenProject(project: Project) {
      this.openProject = project
    },
    async ConnectProjectDB(): Promise<any[]> {
      if (this.openProject) {
        await DBQueue.onIdle()
        return await database.connect(this.openProject.path)
      }
      return [null, 'No project open']
    },
    async SaveToDB({ key, data }: { key: string; data: any }): Promise<DesktopResult<string>> {
      if (database.readOnly || useViewerStore().wrap.wraping)
        return [null, 'BUSY: 請先完成批次作業與衝突處理']
      // const start = performance.now()
      const stringData = JSON.stringify(data)
      // const end = performance.now()
      // console.log(`stringify: ${(end - start) / 1000} 秒`)
      const { database: bound } = useDesktop().captureProject()
      const project = this.openProject?.path
      return (await DBQueue.add(async (): Promise<DesktopResult<string>> => {
        if (project !== this.openProject?.path) return [null, 'STALE_PROJECT: 專案已切換']
        const result = await bound.save(key, stringData)
        if (result[1]) reportDesktopError(result[1])
        return result
      })) || [null, 'DB_QUEUE: 儲存作業未完成']
    },
    async DeepSaveToDB({ key, data }: { key: string; data: any }) {
      if (database.readOnly || useViewerStore().wrap.wraping) return
      const stringData = JSON.stringify(data)
      const { database: bound } = useDesktop().captureProject()
      const project = this.openProject?.path
      return await DBQueue.add(async () => {
        if (project !== this.openProject?.path) return [null, 'STALE_PROJECT: 專案已切換']
        const result = await bound.deepSave(key, stringData)
        if (result[1]) reportDesktopError(result[1])
        return result
      })
    },
    async DBSlice({ key, index }: { key: string; index: number }) {
      if (database.readOnly || useViewerStore().wrap.wraping) return
      const { database: bound } = useDesktop().captureProject()
      const project = this.openProject?.path
      return await DBQueue.add(async () => {
        if (project !== this.openProject?.path) return [null, 'STALE_PROJECT: 專案已切換']
        const result = await bound.slice(key, index)
        if (result[1]) reportDesktopError(result[1])
        return result
      })
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
      const project = this.openProject?.path
      for (const key of syncKeys) {
        const [getRes, getError] = await database.get(key)
        if (getError) return alert(getError)
        if (project !== this.openProject?.path || !this.dbData) return
        Object.assign(this.dbData, { [key]: getRes })
      }
    }
  },
  getters: {
    projectName(): string {
      return this.openProject?.name || ''
    },
    projectMainFolder(): MainFolder | Record<string, never> {
      return this.sourceFolder || this.dbData?.mainFolder || {}
    },
    readOnly(): boolean {
      return database.readOnly || useViewerStore().wrap.wraping
    }
  }
})
