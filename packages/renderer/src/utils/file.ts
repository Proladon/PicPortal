import path from 'path-browserify'

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

export const getFileExt = (filePath: string): string => {
  if (!filePath) return ''
  if (window.electron.platform.isWindows)
    filePath = filePath.replace(/\\/g, '/')
  const fileBase = path.basename(filePath)
  if (fileBase) {
    const file = path.parse(fileBase)
    return file.ext
  }
  return ''
}

export const getFileDir = (filePath: string): string => {
  if (!filePath) return ''
  if (window.electron.platform.isWindows)
    filePath = filePath.replace(/\\/g, '/')
  return path.dirname(filePath)
}

export const localFile = (filePath: string): string => {
  if (!filePath) return ''
  return `local-resource://${filePath}`
}
