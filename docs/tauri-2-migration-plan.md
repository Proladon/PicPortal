# PicPortal 遷移至 Tauri 2 執行規劃

建立日期：2026-10-07  
狀態：已建立階段 0 基線，階段 1 尚未提交，驗證結果與待驗項目見 [實作紀錄](./tauri-2-migration-progress.md)。下列核取方塊代表實作驗收，不代表文件完成度。

## 目標與範圍

將 Electron 執行環境全面替換為 Tauri 2，保留現有圖片管理、Portal 分類、批次複製／搬移、專案管理與使用者設定功能。

- 保留 Vue 3、Pinia、Vue Router、Naive UI 與現有畫面；只調整必要的桌面整合。
- 將 Node.js 後端功能改為 Rust commands 或 Tauri plugins；最終應用不依賴 Node.js sidecar。
- 保留既有 `.db` 專案檔的 JSON 格式、ID、圖片路徑與分類資料。
- 遷移 `electron-store` 的專案清單與設定，保留原始設定檔。
- 以 Windows 為首要驗收平台，依據目前 release／tests workflow 的 Windows matrix。macOS、Linux 的支援需各自建置與實測後才能宣告完成。
- 採用實作時確認相容的 Tauri 2.x 穩定版本，固定依賴與 lockfile，不限定最初的 2.0.0。
- 這份規劃不包含行動版、UI 重設計、SQLite 遷移、縮圖快取或大規模前端套件升級。

遷移期間保留 Electron 作為行為比對與回退入口。兩種執行環境使用資料副本驗收，避免同時寫入同一份專案。

## 現況與替換方向

| 現有位置／依賴 | 現有用途 | 替換方向 |
| --- | --- | --- |
| `packages/main/src/index.ts` | 視窗、單一實例、生命週期、圖片協定、自動更新 | Tauri 設定、Rust 啟動流程、single-instance／updater plugins |
| `packages/preload/src/index.ts` | `window.electron` API bridge | 前端 `useDesktop()` 與 Tauri adapter |
| `packages/preload/src/main/modules/fileSystem.ts` | `fs-extra` 複製、搬移、刪除與 JSON 寫入 | Rust commands，明確保留檔案衝突語意 |
| `packages/preload/src/main/modules/fastGlob.ts` | `fast-glob` 遞迴掃描 | Rust 掃描目錄與副檔名過濾 |
| `packages/preload/src/main/modules/database.ts` | `lowdb` 讀寫專案 JSON | Rust 管理專案狀態與序列化寫入 |
| `packages/preload/src/main/modules/userStore.ts` | `electron-store` 設定與專案清單 | store plugin 與一次性匯入流程 |
| `packages/preload/src/main/modules/browserDialog.ts` | 開啟／儲存對話框 | dialog plugin，由 adapter 統一回傳格式 |
| `packages/preload/src/main/modules/app.ts` | 視窗操作、開啟網址、以 Git tag 取得版本 | Tauri window API、opener plugin、應用版本 API |
| `packages/renderer/src/utils/file.ts`、各圖片元件 | `local-resource://`、平台路徑處理 | 共用圖片 URL 函式、跨平台路徑介面 |
| `TitleBar.vue`、`PortalTagModal.vue` | Electron 拖曳標題列、外部檔案 `File.path` | Tauri 視窗拖曳與原生檔案拖入整合 |
| `scripts/`、`electron-builder.config.js`、`.github/workflows/` | Electron 開發、建置、發布 | Tauri CLI、Rust 檢查、安裝包與更新產物建置 |
| `tests/app.spec.js` | Spectron 啟動測試 | Tauri 桌面 smoke test 與資料／檔案操作測試 |

Tauri 的開發伺服器與前端產物透過 `devUrl`、`beforeDevCommand`、`frontendDist` 等設定銜接現有 Vite 專案。[官方文件](https://v2.tauri.app/develop/)

## 實作原則

1. 先建立桌面 API 邊界，再替換底層，避免每個 Vue 元件直接操作 Tauri API。
2. 前端負責畫面、分類互動與既有工作佇列；Rust 負責檔案操作、目錄掃描與專案資料寫入。阻塞 I/O 不在 UI 執行緒上執行。
3. 第一輪保留前端現有 `[結果, 錯誤]` 使用方式，由 adapter 轉換 Rust 的回傳／拒絕；錯誤碼使用可序列化資料，保留 `FILE_EXIST`。
4. 原生 plugins 與自訂 commands 的存取限制分別處理。不能假設 plugin 的 fs scope 會自動限制自行實作的 Rust 檔案操作。
5. 讀寫權限以目前專案檔、來源資料夾與 Portal 目的資料夾為依據；以後端驗證的專案內容／使用者選取結果建立允許範圍，不能直接信任前端送來的任意路徑。
6. 先完成功能等價，再另案改善效能。只升級本次建置所必要的依賴，不同時替換 CSS 系統或重寫圖片瀏覽器。

## 階段總覽

各階段建議各自形成可審查的提交或 PR；完整驗收後再進入下一階段。不在這份文件承諾工期，階段 0 完成後依基線問題估算。

| 階段 | 交付成果 | 依賴 | 完成後可做什麼 |
| --- | --- | --- | --- |
| 0：基線與資料盤點 | 操作基線、測試資料、資料相容性規格 | 無 | 明確比對遷移前後行為 |
| 1：桌面 API 抽象 | `useDesktop()`、型別、Electron adapter | 0 | 現有 Electron 使用統一介面 |
| 2：Tauri 執行骨架 | Rust 專案、Vite 整合、視窗與基本 plugins | 1 | 啟動 Tauri 並操作基本視窗 |
| 3：專案讀取與圖片瀏覽 | JSON 讀取、掃描、圖片 URL 與存取範圍 | 2 | 開啟舊專案並瀏覽圖片 |
| 4：資料寫入與檔案處理 | 分類儲存、批次複製／搬移、衝突處理 | 3 | 執行核心圖片整理工作 |
| 5：設定遷移與互動整合 | 舊設定匯入、拖曳、生命週期、完整 UI | 4 | 日常功能達到等價 |
| 6：測試、打包與更新 | CI、Windows 安裝包、更新驗證 | 5 | 從乾淨環境安裝、啟動與更新 |
| 7：移除 Electron | 依賴、原始碼、流程與文件清理 | 6 | 專案全面使用 Tauri 2 |

### 階段 0：建立基線與資料相容性規格

**工作內容**

- 確認套件管理器與 lockfile；目前 CI 使用 `npm ci`，須確認實際可用的 lockfile，不能只改 workflow。
- 執行現有開發啟動、前端建置、型別檢查與 lint，記錄既有失敗與必要修復，避免與遷移問題混淆。
- 盤點使用中的 bridge 方法，區分未使用介面；例如 `Database-Find` 的函式參數與 `Wraping` 呼叫不直接照搬。
- 建立操作基線：專案新增／匯入／編輯／移除、選擇主資料夾、瀏覽模式、分類、批次作業、衝突處理、設定、重啟。
- 建立匿名資料副本：正常與空白專案、損毀 JSON、中文與特殊字元路徑、多層資料夾、重複檔名。
- 釐清現有資料差異：新建專案寫入 `id`、`mainFolder: ''`，型別卻宣告 `project`、物件型別的 `mainFolder`。依實際檔案制定相容讀取規則，不能只依型別反推格式。
- 確認 Electron 實際 userData 路徑與設定檔名稱；若無既有安裝資料，提供手動選檔匯入路徑。
- 記錄同一台機器、同一批圖片下的啟動時間、掃描耗時與記憶體用量，供後續比較。

**驗收條件**

- [x] 已保存可重現的操作清單、資料樣本與現有問題紀錄。
- [x] 已定義 `.db` 相容讀取規則與設定匯入來源。
- [x] 已確認前端基線能建置；阻礙遷移的基線問題已修復或有明確處理方案。

### 階段 1：建立桌面 API 抽象

**工作內容**

- 新增 `packages/renderer/src/desktop/`，定義 `DesktopApi`、Electron adapter 與後續 Tauri adapter 的位置。
- 新增 `useDesktop()`，集中提供 `userStore`、`browserDialog`、`fileSystem`、專案資料、掃描、視窗、平台資訊與圖片 URL。
- 替換所有 `useElectron()` 與直接存取 `window.electron` 的呼叫。包含模組頂層解構、About 頁面與路徑工具。
- 統一 open／save dialog 的取消與路徑回傳格式，避免 UI 依賴 Electron 的 `canceled`、`filePaths` 結構。
- 定義錯誤碼、非同步介面與初始化順序；adapter 必須在 Pinia store 或元件使用前可取得。
- 將所有 `local-resource://` 組字串改成共用 `toImageUrl()`，此階段仍由 Electron adapter 產生原協定 URL。
- Electron adapter 先保留既有行為，作為替換 Tauri 的比對基礎。

**驗收條件**

- [ ] Electron 下主要操作與階段 0 基線一致。
- [ ] 桌面專用呼叫集中於 adapter；Vue 元件與 store 不直接使用 Electron API。
- [ ] 圖片 URL 與對話框回傳值有單一轉換入口，前端型別檢查通過。

### 階段 2：建立 Tauri 執行骨架

**工作內容**

- 新增根目錄 `src-tauri/`，包含 Cargo 設定、`tauri.conf.json`、capabilities 與 Rust 模組。
- 加入 Tauri 2 CLI／API 與必要 plugins，確認 Rust、Windows C++ 建置工具與 WebView2 環境。
- 將 Vite 開發網址與 `packages/renderer/dist` 銜接 Tauri；保留前端現有路徑 alias 與環境變數。
- 調整 renderer 的 Electron Chrome target、Node builtin external 設定與必要依賴，確認產物可在 WebView 執行。
- 過渡期分開提供 Electron 與 Tauri 的開發／建置入口，adapter 明確選擇執行環境。
- 完成無框視窗、標題列拖曳、最小化、最大化、關閉、開啟網址與平台／版本資訊。
- 使用應用版本 API 取代 `simple-git`，版本資訊不依賴終端使用者安裝 Git 或存在 `.git`。
- 未實作功能先回傳明確錯誤；不得因初始化缺少 bridge 而白畫面或寫入假資料。

**驗收條件**

- [ ] Tauri 開發模式能顯示主要畫面、路由與樣式，HMR 可用。
- [ ] 基本視窗操作可用，標題列按鈕不會誤觸視窗拖曳。
- [ ] 前端與 Rust 均可建置，尚未接上的功能有可辨識錯誤。

### 階段 3：開啟舊專案並瀏覽圖片

**工作內容**

- 實作 dialog plugin 的專案檔／資料夾選取，由 adapter 維持 UI 所需格式。
- 以 Rust 讀取 `.db` JSON，保留未知欄位並接受階段 0 確認的舊格式；本階段先提供讀取，不寫回專案。
- 實作來源目錄遞迴掃描，支援現有副檔名過濾。明確定義大小寫、排序、隱藏檔與符號連結處理。
- 不把使用者路徑當 glob pattern；驗證括號、中文、空白、`#`、`%` 等檔名及一／二／多種副檔名篩選。
- Tauri adapter 使用 `convertFileSrc()`；設定 asset protocol scope 與 CSP，使使用者選定來源目錄的圖片可顯示。[官方文件](https://v2.tauri.app/reference/javascript/api/namespacecore/#convertfilesrc)
- 分別處理檔案操作 scope 與圖片 asset scope；重新開啟專案後，由後端重新驗證並授權合法來源，避免只在第一次選取時可用。
- 驗證 Grid、List、VirtualGrid、VirtualList、Focus 與大圖預覽；移除 Tauri 路徑上的 `local-resource://` 依賴。

**驗收條件／里程碑 A**

- [ ] 可在 Tauri 中選取既有 `.db`，讀取分類資料並顯示來源圖片。
- [ ] 五種瀏覽模式及大圖預覽可用，特殊字元路徑不破圖。
- [ ] 重啟、重新選取專案後仍可瀏覽；本階段沒有修改舊專案內容。
- [ ] 檔案不存在、JSON 損毀與無存取權限時，UI 能顯示可理解的錯誤。

### 階段 4：資料寫入與批次檔案處理

**工作內容**

- 實作專案新增與資料儲存、深層更新、陣列刪除、dockings 移除；保留 IDs、未知欄位及既有語意。
- Rust 端序列化寫入，使用同目錄暫存檔與適合 Windows 的替換流程；失敗保留原檔，不將前端佇列當成唯一併發保障。
- 專案切換時綁定作業的專案識別，防止上一個專案的延遲任務寫入新專案。
- 實作建立、存在檢查、複製、搬移、刪除與覆寫；建立目的目錄，處理跨磁碟搬移與相同來源／目的路徑。
- 保留 `FILE_EXIST`、跳過、檔名加序號、刪除與覆寫等現有選項；預設操作不得覆蓋目的檔案。
- 保留 `PQueue` 的進度 UI，明確定義成功／失敗計數與 dockings 清理條件。只有成功作業可從分類待處理資料移除。
- 後端驗證讀寫範圍、路徑正規化及符號連結／junction 解析結果；禁止透過替換路徑繞過允許範圍。
- 在資料副本與暫存目錄執行檔案操作整合測試，包含衝突、無權限、來源消失、跨磁碟失敗與併發寫入。

**驗收條件／里程碑 B**

- [ ] 分類變更與專案內容在重啟後保留，原有資料格式及未知欄位不遺失。
- [ ] 批次複製／搬移與衝突選項可用，進度和實際檔案結果一致。
- [ ] 跨磁碟搬移須在複製成功後才刪來源；失敗不誤刪來源或目的既有檔案。
- [ ] 寫入失敗不破壞原 JSON，專案切換不會將資料寫到錯誤檔案。

### 階段 5：設定遷移與完整互動整合

**工作內容**

- 以 store plugin 保存專案清單、語言與其他現有設定。[官方文件](https://v2.tauri.app/plugin/store/)
- 首次啟動讀取已確認位置的 Electron 設定檔；找不到時提供手動匯入。新設定已存在時不直接覆蓋。
- 匯入完成並成功持久化後才寫入遷移標記；保留來源檔，驗證可重試且不重複建立專案。
- Tauri adapter 的 `set` 必須等到後端完成必要儲存才回覆；不能沿用 preload 忽略 IPC Promise 的方式。
- 將外部檔案／資料夾拖入改成 Tauri 原生拖曳事件，取代 `File.path`；原生事件依 drop 座標交給對應區域。
- 先驗證原生檔案拖入與 `vuedraggable` 的共存方案。Windows 若使用 HTML5 拖曳須調整原生 handler 設定，不能直接關閉後仍假設可收到原生檔案事件。[官方文件](https://v2.tauri.app/reference/javascript/api/namespacewebview/)
- 完成 single-instance、第二次啟動聚焦、最小化還原；關閉視窗時處理正在執行的批次任務與未完成儲存。[single-instance 文件](https://v2.tauri.app/plugin/single-instance/)
- 完成專案清單增刪改、設定頁、快捷鍵、狀態列、About 資訊與外部資料夾開啟。
- 檢查非同步事件訂閱解除與重複監聽，避免重新掛載後重複處理拖入或進度事件。

**驗收條件／里程碑 C**

- [ ] 舊設定可匯入；匯入重試、重啟與後續儲存不丟失或重複資料。
- [ ] 外部資料夾拖入、Portal 內部排序與快捷鍵均可用。
- [ ] 階段 0 操作清單在 Tauri 全部通過；任何差異都有處理結果。
- [ ] 無 Git、無專案目錄的環境仍能顯示版本；單一實例與關閉流程正常。

### 階段 6：測試、安裝包與更新流程

**工作內容**

- 將 Tauri 桌面 smoke test 接入 Windows CI，取代 Spectron；驗證啟動、非空畫面、主要路由與正式版不預設開啟 DevTools。
- 保留並自動化階段 4 的資料／檔案整合測試；前端型別、lint、建置及 Rust format／clippy／tests 納入檢查。
- 調整 workflow 觸發路徑，涵蓋 `src-tauri/**`、Cargo／前端 lockfile、設定及 scripts，避免 Rust 變更漏跑 CI。
- 統一 package、Tauri 設定、安裝包、tag 與 updater manifest 的版本來源；取代目前從 `electron-builder.config.js` 產生日曆版本的耦合。
- 建置選定的 Windows 安裝包、應用圖示、識別碼與必要 WebView2 安裝策略，在乾淨環境驗證。
- 加入 updater plugin，設定產物簽章、公鑰、更新端點與 manifest；更新簽章和 Windows 程式碼簽章分開處理。[官方文件](https://v2.tauri.app/plugin/updater/)
- 在測試發布管道驗證兩個 Tauri 版本間的更新，以及無更新、離線、簽章錯誤與安裝失敗。
- Electron → Tauri 首次切換預設使用安裝包與設定匯入；若要求由 Electron updater 直接切換，須另行驗證安裝器與更新格式相容性。
- 驗證 Electron／Tauri 安裝位置、應用識別與並存／替換行為，避免新安裝或解除安裝誤刪舊資料。
- 比較階段 0 效能基線，記錄實測差異；若核心流程明顯退步，先定位問題再完成切換。
- 調整 GitHub release workflow，先產生可驗證的產物與草稿；正式發布屬後續執行步驟。

**驗收條件／里程碑 D**

- [ ] CI 可重現建置，前端與 Rust 檢查及核心整合測試通過。
- [ ] Windows 安裝包在乾淨環境可安裝、啟動、匯入舊資料、重啟及解除安裝。
- [ ] 更新流程完整驗證；若缺少簽章秘密或測試端點，此項維持未完成並記錄缺項。
- [ ] 最終測試結果、安裝／遷移／回退步驟與已知限制已記錄。

### 階段 7：移除 Electron 並收尾

**進入條件：里程碑 D 完成，Tauri 日常操作與安裝／更新流程通過驗收。**

**工作內容**

- 移除 Electron adapter、`useElectron()`、bridge 型別、`packages/main` 與 `packages/preload`。
- 移除 `electron`、builder、updater、devtools、store、Spectron 與已無使用的 `fs-extra`、`fast-glob`、`lowdb`、`simple-git`。
- 清理 Electron 專用 watch／build／vendor scripts、設定、環境型別及 `update-electron-vendors.yml`；保留仍有使用的共用工具。
- 清理 About 的 Electron 資訊與圖示、TS config 引用及正式版產物。
- 將預設開發、建置、檢查入口切換為 Tauri，更新 README 與開發環境說明。
- 保留程式庫歷史中的 Electron 版本與已驗證資料備份，提供回退版本與手動重新安裝步驟。

**驗收條件／最終完成定義**

- [ ] 應用原始碼、執行依賴與生效的 CI／scripts 不再需要 Electron；歷史紀錄與本規劃中的說明不算殘留。
- [ ] 從乾淨 checkout 依文件可安裝依賴、開發啟動、檢查與打包，不需要 Electron 或 Node.js sidecar。
- [ ] 清理後重新執行完整檢查與 Windows 安裝 smoke test，結果通過。
- [ ] 舊專案、設定匯入、分類儲存、批次作業、拖曳與更新的驗收紀錄齊全。

## 主要風險與處理

| 風險 | 處理方式 | 處理階段 |
| --- | --- | --- |
| 舊依賴或既有型別錯誤妨礙建置 | 建立基線，分開必要修復與遷移變更 | 0、2 |
| `.db` 實際格式與型別不同 | 以資料樣本建立相容規格，保留未知欄位，禁止讀取時自動改檔 | 0、3、4 |
| 設定路徑不同或匯入中斷 | 確認真實來源、支援手動匯入、成功儲存後標記、保留來源 | 0、5 |
| 檔案已授權但圖片仍無法顯示 | 分別驗證 fs／command 存取與 asset protocol scope、CSP | 3 |
| 搬移語意差異造成資料損失 | 明確處理衝突與跨磁碟失敗，以資料副本測試 | 4 |
| 原生檔案拖入與 HTML5 排序衝突 | 獨立驗證共存方案，再接完整分類流程 | 5 |
| 舊更新流程無法交接新安裝包 | 首次以安裝包切換，獨立驗證 Tauri 更新與簽章 | 6 |
| 更換框架後瀏覽效能仍有限 | 同資料集實測；縮圖與 JSON 寫入效能列入後續專案 | 0、6 |

## 驗收紀錄格式

每階段完成時在提交／PR 或附屬紀錄中填寫：

- 實作範圍與對應階段。
- 執行環境：OS、Node、Rust、Tauri 版本。
- 使用資料集、測試指令、手動操作結果與必要畫面。
- 已知差異、未完成項目及是否阻礙下一階段。
- 修改過的資料位置與回退方式。

未在某平台建置或測試的項目標記為未驗證，不能以 Windows 結果代替其他平台驗收。
