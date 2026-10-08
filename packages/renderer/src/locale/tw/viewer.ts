export default {
  notify: {
    needPortal: '請先至少啟用一個 Portal',
    dockingsCleared: '已清除所有連結',
    missingPortal: '部分分類的 Portal 已不存在，請先修正分類',
  },
  modes: {
    label: '檢視模式',
    GridView: '網格',
    ListView: '清單',
    VirtualGrid: '虛擬網格',
    VirtualList: '虛擬清單',
    FocusView: '專注',
  },
  toolbar: {
    filter: '篩選',
    refresh: '重新整理',
    quickActions: '快速動作',
    perPage: '每頁數量',
    imageSize: '縮圖大小',
    dockings: '已連結 {count} 張',
  },
  warpingBtn: {
    label: '開始傳送',
    warping: '正在傳送中...',
  },
  wrapConfirm: {
    title: '開始傳送',
    content: '確認要開始傳送檔案?',
  },
  viewerFilter: {
    title: '篩選圖片',
    onlyDockings: '只顯示已連結',
    portals: 'Portals',
    fileTypes: '檔案類型',
    reset: '清除篩選',
    filterPortals: {
      placeholder: '過濾 Portals',
      empty: '找不到 Portal',
    },
    filterFilesTypes: {
      placeholder: '過濾檔案類型',
    },
  },
  quickActions: {
    clearDockings: {
      label: '清除所有連結',
      warning: '確定要清除所有連結嗎？',
    },
  },
  empty: {
    title: '沒有圖片',
    description: '這個資料夾沒有符合條件的圖片。',
    noFolderTitle: '尚未選擇主資料夾',
    noFolderDescription: '選擇要整理的圖片資料夾。',
    chooseFolder: '選擇資料夾',
  },
  noProject: {
    title: '尚無開啟專案',
    description: '先開啟或建立專案，再開始分類圖片。',
    goProjects: '前往專案',
  },
  pagination: {
    summary: '第 {page} / {total} 頁',
    previous: '上一頁',
    next: '下一頁',
    jump: '跳至',
  },
  focus: {
    previous: '上一張',
    next: '下一張',
    path: '路徑',
    portals: 'Portals',
    noPortals: '尚未連結任何 Portal',
  },
  item: {
    preview: '預覽',
    removePortal: '移除 {name}',
  },
  conflict: {
    title: '檔案已存在',
    description: '目的地已有同名檔案，請選擇處理方式。',
    source: '來源',
    destination: '目的地',
    sameOperation: '後續衝突皆同樣操作',
    rename: '重新命名',
    plusNum: '檔名 +(1)',
    delete: '刪除檔案',
    override: '覆蓋',
    skip: '忽略',
    newFileName: '新檔名',
    invalidFileName: '檔名不可為空、不可包含特殊字元，也不可用句點或空白結尾',
  },
}
