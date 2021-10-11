import { ipcMain } from 'electron'
import { Low, JSONFile, Memory } from 'lowdb'
import { set, setWith, slice } from 'lodash-es'

const ipc = ipcMain
let db: Low = new Low(new Memory())

const database = () => {
  ipc.handle('Database-Connect', async (e, dbPath: string) => {
    try {
      db = new Low(new JSONFile(dbPath))
      await db.read()
      db.data ||= {}
      return [db.data, null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Database-Save', async (e, key, data) => {
    try {
      await db.read()

      const start = performance.now()
      const parseData = JSON.parse(data)
      db.data[key] = parseData
      await db.write()
      const end = performance.now()
      console.log(`write: ${(end - start) / 1000} 秒`)
      return ['success', null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Database-Deep-Save', async (e, keys, data) => {
    try {
      const start = performance.now()
      await db.read()
      const parseData = JSON.parse(data)
      setWith(db.data, keys, parseData, Object)
      await db.write()
      const end = performance.now()
      console.log(`deep write: ${(end - start) / 1000} 秒`)
      return ['success', null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Database-Slice', async (e, key: string, index: number) => {
    try {
      const start = performance.now()
      await db.read()
      db.data[key].splice(index, 1)
      await db.write()
      const end = performance.now()
      console.log(`splice: ${(end - start) / 1000} 秒`)
      return ['success', null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Database-Get', async (e, key: string) => {
    try {
      await db.read()
      const res = db.data[key]
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Database-Find', async (e, callback) => {
    try {
      const res = callback(db)
      return [res, null]
    } catch (error) {
      return [null, error]
    }
  })
}

export default database
