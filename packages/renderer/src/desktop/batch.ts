import type { DesktopApi, DesktopResult } from './types'

export type ConflictAction = 'skip' | 'plusNum' | 'delete' | 'override' | 'rename'
export interface BatchConflict {
  id: number
  filePath: string
  destPath: string
  mode: 'copy' | 'move'
}
export interface ConflictDecision { action: ConflictAction; name?: string }
export interface BatchItem { target: string; destinations: string[] }

/** One source is copied to every earlier Portal before the final move. */
export async function processBatchItem(
  item: BatchItem,
  desktop: Pick<DesktopApi, 'fileSystem' | 'database'>,
  conflict: (data: Omit<BatchConflict, 'id'>) => Promise<ConflictDecision>,
  isCurrent: () => boolean
): Promise<'success' | 'skip'> {
  const check = () => {
    if (!isCurrent()) throw new Error('STALE_PROJECT: 專案已切換，舊作業已停止')
  }
  const success = <T>(result: DesktopResult<T>) => {
    if (result[1]) throw new Error(result[1])
  }
  if (!item.destinations.length) throw new Error('INVALID_PORTAL: 分類目的地不存在')
  for (let index = 0; index < item.destinations.length; index++) {
    check()
    const destPath = item.destinations[index]
    const mode = index === item.destinations.length - 1 ? 'move' : 'copy'
    const operation = mode === 'copy' ? desktop.fileSystem.copyFile : desktop.fileSystem.moveFile
    let result = await operation(item.target, destPath)
    while (result[1] === 'FILE_EXIST') {
      const decision = await conflict({ filePath: item.target, destPath, mode })
      check()
      if (decision.action === 'skip') return 'skip'
      if (decision.action === 'delete') {
        success(await desktop.fileSystem.deleteFile(item.target))
        success(await desktop.database.pullDockings(JSON.stringify([{ target: item.target }])))
        return 'success'
      }
      if (decision.action === 'override') {
        const [, error] = await desktop.fileSystem.overrideFile(item.target, destPath, mode)
        result = error ? [null, error] : [undefined, null]
      } else {
        const normalized = destPath.replace(/\\/g, '/')
        const slash = normalized.lastIndexOf('/')
        const filename = normalized.slice(slash + 1)
        const dot = filename.lastIndexOf('.')
        const base = filename.slice(0, dot)
        const extension = filename.slice(dot)
        if (decision.action === 'rename') {
          if (!decision.name || /[\\/:*?"<>|]/.test(decision.name) || /[. ]$/.test(decision.name))
            throw new Error('INVALID_PATH: 請輸入合法檔名')
          result = await operation(item.target, `${normalized.slice(0, slash + 1)}${decision.name}${extension}`)
        } else {
          for (let number = 1; number <= 10000; number++) {
            check()
            result = await operation(item.target, `${normalized.slice(0, slash + 1)}${base}(${number})${extension}`)
            if (result[1] !== 'FILE_EXIST') break
            if (number === 10000) throw new Error('FILE_EXIST: 找不到可用序號檔名')
          }
        }
      }
    }
    success(result)
  }
  check()
  success(await desktop.database.pullDockings(JSON.stringify([{ target: item.target }])))
  return 'success'
}
