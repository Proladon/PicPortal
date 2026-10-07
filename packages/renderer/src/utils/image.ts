import { localFile as toImageUrl } from '/@/utils/file'
import { api as viewerApi } from 'v-viewer'

export const openViewer = (imgPath?: string) => {
  viewerApi({
    options: { navbar: false },
    images: [toImageUrl(imgPath)],
  })
}
