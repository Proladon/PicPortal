import { ipcRenderer } from 'electron'

const fastGlob = {
  scanImages(directory: string, extensions: string[]) {
    return ipcRenderer.invoke('Scan-Images', directory, extensions)
  },
  glob(patterns: any, options: any) {
    const res = ipcRenderer.invoke("Glob", patterns, options)
    return res
  },
}

export default fastGlob
