# 桌面 API 邊界

Vue 元件、store 與工具透過 `useDesktop()` 取得桌面功能；不得直接使用 `window.electron`、Electron dialog 結構或圖片協定。

- `index.ts` 同步選取並快取 adapter，支援 store 在模組載入時取得 API。
- `electron.ts` 是目前的 Electron adapter。
- `tauri.ts` 已在階段 2 加入；`index.ts` 使用 Tauri 的 `isTauri()` 選取 adapter，否則使用 Electron bridge。
- `initialize()` 在 Vue 掛載前載入原生平台資訊。Electron bridge 已同步備妥；Tauri 初始化失敗會顯示錯誤文字。
- 未完成的 Tauri 功能回傳 `NOT_IMPLEMENTED`，不得建立假的專案或設定。設定／對話框／掃描以 Promise 拒絕；檔案與專案操作保留 `[null, 錯誤字串]`。
- `status.ts` 保存 UI 錯誤訊息。骨架模式的專案清單與設定讀取失敗後解除 loading，保留路由、視窗控制與 About；設定未成功載入時不提供儲存。
- `types.ts` 定義中立型別。檔案與資料操作沿用 `[值, 錯誤]`；錯誤是可序列化字串，檔案衝突保留 `FILE_EXIST`。Dialog 取消回傳 `null`；開啟回傳路徑陣列，儲存回傳單一路徑。設定與視窗操作回傳 Promise，錯誤以拒絕傳遞。
- 資料寫入仍傳遞 JSON 字串，保留現有 DB queue；專案綁定與後端序列化寫入在階段 4 處理。
- `getDroppedPaths()` 暫時封裝 Electron 的 `File.path`；Tauri 原生拖入訂閱與解除在階段 5 實作。
- 標題列的 Tauri `mousedown` 呼叫 adapter 的 `startDragging()`；視窗按鈕區域停止事件傳遞，Electron 延用原本的 CSS 拖曳。

Electron 的 `Database-Find` 需要跨 IPC 傳函式，`Wraping` 沒有主程序 handler；兩者沒有 UI 呼叫，故不加入 `DesktopApi`。
