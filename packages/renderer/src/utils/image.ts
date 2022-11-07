import { api as viewerApi } from 'v-viewer'

export const openViewer = (imgPath: string) => {
  viewerApi({
    options: { navbar: false },
    images: [`local-resource://${imgPath}`],
  })
}
