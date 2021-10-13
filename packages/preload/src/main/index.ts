import userStore from './modules/userStore'
import browserDialog from './modules/browserDialog'
import fastGlob from './modules/fastGlob'
import fileSystem from './modules/fileSystem'
import database from './modules/database'
import appWindow from './modules/app'

const ipcHandler = () => {
  userStore(),
    browserDialog(),
    fastGlob(),
    fileSystem(),
    database(),
    appWindow()
}

export default ipcHandler
