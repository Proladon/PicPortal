import { useDesktop, toImageUrl } from '/@/desktop'
import path from 'path-browserify'

/** Compare legacy Windows separators without changing persisted paths. */
export const filePathKey = (filePath: string): string =>
  useDesktop().platform.isWindows
    ? filePath.replace(/\\/g, '/').toLowerCase()
    : filePath

export const sameFilePath = (a?: string, b?: string): boolean =>
  Boolean(a && b && filePathKey(a) === filePathKey(b))

export const getFileName = (filePath: string): string => {
  if (!filePath) return ''
  if (useDesktop().platform.isWindows) filePath = filePath.replace(/\\/g, '/')
  const fileBase = path.basename(filePath)
  if (fileBase) {
    const file = path.parse(fileBase)
    return file.name
  }
  return ''
}

export const getFileExt = (filePath: string): string => {
  if (!filePath) return ''
  if (useDesktop().platform.isWindows) filePath = filePath.replace(/\\/g, '/')
  const fileBase = path.basename(filePath)
  if (fileBase) {
    const file = path.parse(fileBase)
    return file.ext
  }
  return ''
}

export const getFileDir = (filePath: string): string => {
  if (!filePath) return ''
  if (useDesktop().platform.isWindows) filePath = filePath.replace(/\\/g, '/')
  return path.dirname(filePath)
}

export const localFile = (filePath: string): string => {
  if (!filePath) return ''
  return toImageUrl(filePath)
}
