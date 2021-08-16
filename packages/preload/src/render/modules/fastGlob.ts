import { ipcRenderer } from 'electron'

const fastGlob = {
  glob(patterns: any, options: any) {
    const res = ipcRenderer.invoke("Glob", patterns, options)
    return res
  },
}

export default fastGlob