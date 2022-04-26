import path from 'path'

export const getFileName = (filePath: string): string => {
  if (!filePath) return ''
  if (window.electron.platform.isWindows)
    filePath = filePath.replace(/\\/g, '/')
  const fileBase = path.basename(filePath)
  if (fileBase) {
    const file = path.parse(fileBase)
    return file.name
  }
  return ''
}
