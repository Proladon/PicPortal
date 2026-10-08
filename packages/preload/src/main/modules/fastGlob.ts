import { ipcMain } from 'electron'
import fg from 'fast-glob'

const ipc = ipcMain

const browserDialog = () => {
  ipc.handle('Scan-Images', async (_event, directory: string, extensions: string[]) => {
    if (!extensions.length) return []
    // cwd is a literal path, so glob metacharacters in directory names are safe.
    const patterns = extensions.map((extension) => `**/*.${extension}`)
    return fg(patterns, { cwd: directory, absolute: true })
  })
  ipc.handle('Glob', async (e, patterns, options) => {
    const res: any = await fg(patterns, options)
    return res
  })
}

export default browserDialog
