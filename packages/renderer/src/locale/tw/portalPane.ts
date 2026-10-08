export default {
  title: 'Portals',
  mode: {
    label: '模式',
    append: '添加',
    override: '覆蓋',
  },
  notify: {
    modeChange: '連結模式變更',
  },
  search: {
    placeholder: '搜尋 Portal',
  },
  controls: {
    clear: '清除啟用',
    active: '已啟用 {count}',
    newGroup: '新增群組',
    moveLeft: '移到左側',
    moveRight: '移到右側',
  },
  empty: {
    title: '尚無 Portal 群組',
    description: '建立群組並加入目的資料夾，就能開始分類。',
    noMatch: '找不到符合的 Portal',
    group: '這個群組還沒有 Portal',
  },
  portalTag: {
    openFolder: '開啟資料夾',
    actions: 'Portal 選項',
  },
  portalGroup: {
    addPortal: '新增 Portal',
    actions: '群組選項',
    view: {
      label: '排列方式',
      list: '列表檢視',
      grid: '網格檢視',
    },
    randomColor: '隨機顏色',
    syncColor: '同步顏色',
    rename: '重新命名',
    deleteTitle: '刪除群組',
    deleteContent: '確定要刪除群組「{name}」與其中的 Portal 嗎？',
  },
  portalGroupModal: {
    title: {
      create: '創建 Portal 群組',
      edit: '編輯 Portal 群組',
    },
    name: '群組名稱',
    placeholder: {
      name: '請輸入群組名稱',
    },
  },
  portalModal: {
    title: {
      create: '創建 Portal',
      edit: '編輯 Portal',
    },
    mode: {
      manual: '手動建立',
      drop: '拖放建立',
    },
    fields: {
      name: '名稱',
      link: '目的資料夾',
      bg: '背景顏色',
      fg: '文字顏色',
      preview: '預覽',
    },
    placeholder: {
      name: '請輸入名稱',
      link: '請輸入連結路徑',
    },
    dropHint: '拖放資料夾到這裡',
    dropCount: '已加入 {count} 個資料夾',
  },
  commander: {
    title: '啟用 Portal',
    placeholder: '搜尋 Portal…',
    empty: '找不到 Portal',
  },
}
