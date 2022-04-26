import path from 'path'

export const getFileName = (filePath: string): string => {
  if (!filePath) return ''
  const fileBase = path.basename(filePath)
  if (fileBase) {
    const file = path.parse(fileBase)
    return file.name
  }
  return ''
}
