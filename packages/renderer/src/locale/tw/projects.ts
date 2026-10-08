export default {
  pageTitle: '專案',
  description: '選擇一個專案開始分類圖片',
  count: '{count} 個專案',
  import: '導入專案',
  openExisting: '開啟既有專案 (.db)',
  importElectron: '匯入 Electron 設定',
  newProject: '新建專案',
  dropHint: '拖放 .db 專案檔到這裡即可開啟',
  empty: {
    title: '尚無專案',
    description: '建立新專案，或開啟既有的專案檔。',
  },
  card: {
    edit: '編輯專案',
    delete: '刪除專案',
    current: '目前開啟',
  },
  notify: {
    notFoundProject: '專案檔已不存在',
    deleteSuccess: '專案已刪除',
    updateSuccess: '專案已更新',
    importSuccess: '專案已導入',
    createSuccess: '專案已建立',
    busy: '請先完成批次作業與衝突處理',
    settingsImported: '設定匯入完成，新增 {count} 個專案；已存在的設定已保留',
  },
  deleteProject: {
    title: '刪除專案',
    content: '確定要刪除專案「{name}」嗎？只會從清單移除，不會刪除專案檔。',
  },
  editProject: {
    title: '編輯專案',
    importTitle: '導入專案',
    import: '導入',
    update: '更新',
  },
  createProject: {
    title: '建立新專案',
    description: '專案檔 (.db) 會記錄 Portal 與圖片連結。',
    create: '創建',
    fields: {
      name: '專案名稱',
      path: '專案位置',
      color: '標籤顏色',
    },
    placeholder: {
      projectName: '請輸入專案名稱',
      projectPath: '請選擇專案位置',
    },
    validation: {
      name: '請輸入專案名稱',
      path: '請選擇專案位置',
    },
  },
}
