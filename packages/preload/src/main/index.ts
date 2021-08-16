import userStore from './modules/userStore'
import browserDialog from './modules/browserDialog'
import fastGlob from './modules/fastGlob'

const ipcHandler = () => {
  userStore(),
  browserDialog(),
  fastGlob()
}


export default ipcHandler