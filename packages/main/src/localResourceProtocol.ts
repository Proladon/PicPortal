import { protocol } from 'electron'

export function registerLocalResourceProtocol() {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    try {
      const url = request.url.replace(/^local-resource:\/\//, '')
      return callback(decodeURIComponent(url))
    } catch (error) {
      console.error('無法解析圖片路徑', error)
      return callback({ error: -6 })
    }
  })
}
