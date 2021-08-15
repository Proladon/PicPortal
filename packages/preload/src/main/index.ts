import userStore from './modules/userStore'
import browserDialog from './modules/browserDialog'

const ipcHandler = () => {
  userStore(),
  browserDialog()
}


export default ipcHandler