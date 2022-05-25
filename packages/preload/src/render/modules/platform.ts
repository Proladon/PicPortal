console.log(process)

const platform = {
  versions: process.versions,
  platform: process.platform,
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux'
}

export default platform
