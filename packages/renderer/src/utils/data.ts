export const dataClone = (data: unknown): unknown => {
  return JSON.parse(JSON.stringify(data))
}

export const getFileName = (filePath: string): string => {
  const pathlist = filePath.split('/')
  return pathlist[pathlist.length - 1]
}
