import { ipcMain } from 'electron'
import { Low, JSONFile } from 'lowdb'

const ipc = ipcMain

const database = () => {
  ipc.handle('Database-Connect', async (e, filePath: string) => {
    try {
      const db: Low = new Low(new JSONFile(filePath))
      await db.read()
      return db
    } catch (error) {
      return error
    }
  })

  ipc.handle('Database-Save', async (e, { db, key, data }) => {
    try {
      const database: Low = new Low(new JSONFile(db))
      database.data ||= {
        mainFolder: '',
      }
      database.data[key] = data
      await database.write()
      return [true, null]
    } catch (error) {
      return [null, error]
    }
  })
}

export default database
