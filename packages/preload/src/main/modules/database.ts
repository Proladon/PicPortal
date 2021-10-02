import { ipcMain } from 'electron'
import { Low, JSONFile, Memory } from 'lowdb'

const ipc = ipcMain
let db: Low = new Low(new Memory())

const database = () => {
  ipc.handle('Database-Connect', async (e, dbPath: string) => {
    try {
      console.log(dbPath)
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
      db.data[key] = data
      await db.write()
      return ['success', null]
    } catch (error) {
      return [null, error]
    }
  })

  ipc.handle('Database-Get', async (e, key: string) => {
    try {
      console.group('DB Get')
      console.log(key)
      console.log(db.data[key])
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
