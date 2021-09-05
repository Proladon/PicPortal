import userStore from './modules/userStore'
import browserDialog from './modules/browserDialog'
import fastGlob from './modules/fastGlob'
import fileSystem from './modules/fileSystem'

const ipcHandler = () => {
  userStore(), browserDialog(), fastGlob(), fileSystem()
}

export default ipcHandler
