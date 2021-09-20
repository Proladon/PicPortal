import { useElectron } from '../use/electron'
const { browserDialog } = useElectron()

export const saveProjectDialog = async () => {
  return await browserDialog.save({
    title: '新增專案',
    filters: [
      {
        name: 'Datebase',
        extensions: ['db'],
      },
    ],
  })
}
