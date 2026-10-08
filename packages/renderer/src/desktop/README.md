# 桌面 API 邊界

Vue 元件、store 與工具透過 `useDesktop()` 取得桌面功能；不得直接呼叫 Tauri API、dialog 原生回傳結構或組圖片 URL。

- `index.ts` 同步選取並快取 Tauri adapter，支援 store 在模組載入時取得 API。非 Tauri 環境（一般瀏覽器、Node）丟出 `DESKTOP_UNAVAILABLE`。
- `tauri.ts` 是唯一的 adapter；Electron adapter 已於階段 7 移除。
- `initialize()` 在 Vue 掛載前載入原生平台資訊與設定遷移狀態；失敗會顯示錯誤文字。
- `status.ts` 保存 UI 錯誤訊息。專案清單與設定讀取失敗後解除 loading，保留路由、視窗控制與 About；設定未成功載入時不提供儲存。
- `types.ts` 定義中立型別。檔案與資料操作沿用 `[值, 錯誤]`；錯誤是可序列化字串，檔案衝突保留 `FILE_EXIST`。Dialog 取消回傳 `null`；開啟回傳路徑陣列，儲存回傳單一路徑。設定與視窗操作回傳 Promise，錯誤以拒絕傳遞。
- 資料寫入傳遞 JSON 字串，保留 DB queue。延遲作業必須先呼叫 `captureProject()`，再將綁定介面交給佇列；Rust 以工作階段編號拒絕過期作業，mutex 序列化 I/O，暫存檔替換成功後才更新記憶體資料。
- `batch.ts` 依圖片逐張處理：先完成前幾個 Portal 的複製，最後再搬移。衝突會暫停該圖片，失敗／略過保留 dockings；全部成功或成功刪除來源才清理。`overrideFile` 明確傳入 copy／move，複製覆寫保留來源。
- 新專案位置與新增 Portal 目錄須由原生對話框或原生拖入選取；專案寫入僅限目前 .db，圖片操作僅限來源與驗證的 Portal 目錄。
- 外部拖入只走 `onFileDrop()` 的原生事件，依座標交給對應的 `DropZone`；不使用 HTML `File.path`。
- 標題列 `mousedown` 呼叫 adapter 的 `startDragging()`；視窗按鈕區域停止事件傳遞。
