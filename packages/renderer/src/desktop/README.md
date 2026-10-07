# 桌面 API 邊界

Vue 元件、store 與工具透過 `useDesktop()` 取得桌面功能；不得直接使用 `window.electron`、Electron dialog 結構或圖片協定。

- `index.ts` 同步選取並快取 adapter，支援 store 在模組載入時取得 API。
- `electron.ts` 是目前的 Electron adapter。
- 階段 2 在本目錄加入 `tauri.ts`，由 `index.ts` 明確判斷執行環境。未完成的功能應回傳 `NOT_IMPLEMENTED`，不得建立假的專案或設定。
- `types.ts` 定義中立型別。檔案與資料操作沿用 `[值, 錯誤]`；錯誤是可序列化字串，檔案衝突保留 `FILE_EXIST`。Dialog 取消回傳 `null`；開啟回傳路徑陣列，儲存回傳單一路徑。設定與視窗操作回傳 Promise，錯誤以拒絕傳遞。
- 資料寫入仍傳遞 JSON 字串，保留現有 DB queue；專案綁定與後端序列化寫入在階段 4 處理。
- `getDroppedPaths()` 暫時封裝 Electron 的 `File.path`；Tauri 原生拖入訂閱與解除在階段 5 實作。

Electron 的 `Database-Find` 需要跨 IPC 傳函式，`Wraping` 沒有主程序 handler；兩者沒有 UI 呼叫，故不加入 `DesktopApi`。
