export const dataClone = (data: unknown): unknown => {
  return JSON.parse(JSON.stringify(data))
}
