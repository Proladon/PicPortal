# Tauri 2 遷移實作紀錄

更新日期：2026-10-07（台灣時間）。本輪範圍：階段 0 基線與資料盤點。尚未加入 Tauri 執行環境；Electron 開發、建置與發布入口保留。

提交方式：`refactor` 分支，每階段各一個 commit；提交不代表尚未執行的手動驗收已完成。

## 環境與重現

- Windows 11，OS build 10.0.26300。
- Node 24.6.0、npm 11.5.1、Rust／Cargo 1.97.1。
- Electron 18.3.15、Vite 3.2.11、TypeScript 4.9.5、Vue 3.5.43、vue-tsc 1.8.27。實際解析版本保存於新增的 `package-lock.json`。
- 使用 npm；原始 checkout 沒有 lockfile，`yarn.lock` 被忽略，`.gitignore` 中的 `package.lock.json` 是錯字。此次納入 `package-lock.json`，移除該錯字。
- 本輪 `npm ci --no-audit --no-fund` 實際重新安裝成功（693 packages），不是僅以 dry-run 檢查 lockfile。
- npm 原先因 `@vue/eslint-config-typescript@7` 與 `eslint-plugin-vue@8` 的 peer 衝突無法安裝。改為 config 9.1.0 與 TypeScript ESLint 5，保留 Vue plugin 8；TypeScript 限定 4.9.x。曾試用 Vue plugin 7，但它不支援既有 compiler macros 設定，已撤回。

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:baseline
node tests/electron-baseline.cjs --development
```

`test:baseline` 載入真正的 main 建置入口／preload／IPC，攔截測試視窗的 show 以保持隱藏，使用 `%TEMP%/picportal-migration-*` 資料副本與獨立 userData；結束後只清除經路徑驗證的測試目錄。開發模式另用隱藏視窗與真正 IPC 啟動並關閉 Vite server，未載入 production main 入口。測試不寫入使用者的專案或原始設定。

## 原始基線問題與本輪處理

| 問題 | 結果 |
| --- | --- |
| npm peer 衝突、沒有 lockfile | 已修復，新增可重現的 npm 安裝基礎 |
| main 建置不認得 `node:path` 等 builtin imports | main／preload external 清單涵蓋 `node:` 前綴，完整建置通過 |
| main／preload 的 Low 泛型、空值與 platform 型別錯誤；renderer 多處型別錯誤 | 修正資料實際型別、clone 泛型、必要 props、元件參數與空值分支，保留 strict 檢查 |
| lint 包含建置產物、全域 TS 型別被 `no-undef` 誤判、既有分號與未使用 slot 變數 | 忽略生成檔；TS 名稱解析交由編譯器；修正既有 lint errors。仍有既有排版／any／未使用 import warnings |
| 初次啟動直接讀取不存在的 settings | 統一建立預設設定，等待持久化完成；首次建立專案不再提前 return 而漏掉 UI refresh |
| 首次主題初始化早於 stylesheet 載入，Naive UI 收到空顏色 | 設定主題後等待頁面 load，再取得 CSS variables |
| 兩種副檔名沒有 glob 分支；資料夾路徑被當 glob pattern | 新增 Electron `fastGlob.scanImages()`，Electron 後端使用 literal cwd；一／二／多種副檔名與括號、中文、空白、`#`、`%`、方括號路徑通過 |
| 圖片 URL 直接串接，裸 `%` 可能造成 decode 例外、`#` 可能截斷路徑 | 統一入口編碼路徑，保留 `local-resource` 協定；主程序 decode 改在 try 內，特殊字元圖片在四個瀏覽路由均確認 naturalWidth > 0 |
| preload `set`、`clear`、視窗方法沒有回傳 IPC Promise | 回傳 Promise，使用端可等待儲存完成 |
| Spectron 測試混用 import 與 require | 原測試在 Node 24 出現 `require is not defined`，且依賴已移除的 Electron remote 能力。保留原測試供階段 6 正式替換，本輪新增獨立基線測試入口 |
| production main 的 updater 初始化失敗 | 實際 main smoke 啟動時記錄 `Attempted to register a second handler for 'Store-Get'`；錯誤被更新 catch 處理，畫面與 IPC 測試仍通過。更新能力維持未驗證，隨階段 6 更換 updater 流程處理 |

## `.db` 相容規格

來源依據是新建專案的實際 writer、各分類讀寫呼叫與測試樣本；沒有既有使用者 `.db` 可供比對，後續仍需用實際資料副本確認。

1. 專案檔是 JSON object；新建格式包含 `id`、`mainFolder: ''`、`dockings: []`、`portals: []`。
2. 曾宣告的 `project` 欄位亦接受；`id` 與 `project` 可能各自存在。讀取時不得改名、重建 ID 或寫回檔案。
3. `mainFolder` 接受空字串或 `{ name, path }`；前端 getter 將空字串視為尚未選取。資料儲存時仍保留原始結構。
4. `portals` 是 group 陣列：`{ id, group, childs }`；`childs` 是 `{ id, name, link, bg, fg }` 陣列。
5. `dockings` 是 `{ target, portals }` 陣列；`portals` 保存 Portal ID 字串，並非原宣告的 `{ group, id }` 物件。
6. 頂層與巢狀未知欄位都應保留。空專案可讀取；損毀 JSON 必須回報錯誤。後續 Rust reader 必須驗證內容，不能將未知結構強制套型別。
7. 路徑接受 Windows 斜線或反斜線；不改寫已保存的 `target` 或 Portal link。測試會將模板的 `__SOURCE__` 等欄位換成暫存目錄實際路徑。
8. 既有 lowdb 對不存在的檔案回傳 null，Connect 轉為 `{}` 並視為成功；這是已記錄差異，階段 3 的 Rust reader 應改為明確的檔案不存在錯誤。

樣本放在 `tests/fixtures/migration/`：normal、empty、legacy、corrupt 與匿名 Electron config；`migration-fixtures.cjs` 產生多層資料夾、重複檔名、大小寫副檔名、隱藏檔及特殊字元路徑。

手動驗收可執行 `node tests/migration-fixtures.cjs`，保留一份資料副本並列印路徑。請以列印出的 normal.db／empty.db 測試新增、匯入、編輯、移除、分類、批次操作及重啟；只操作該測試目錄。自動測試會另外生成並清除自己的副本。

## 設定來源與 bridge 盤點

Windows runtime 以名稱 `PicPortal` 查得 userData：`%APPDATA%/PicPortal`；`electron-store` 預設檔名為 `config.json`，測試已確認獨立 userData 下會生成此檔。這台機器未找到原本的 PicPortal 設定目錄；未實測舊安裝包是否使用不同名稱或位置。

階段 5 優先找 `%APPDATA%/PicPortal/config.json`，找不到提供手動選檔。只讀來源，保留 `projects`、`settings` 與未知欄位；新設定已存在時不可直接覆蓋。匯入成功持久化後才標记，重試依 ID／path 避免重複。macOS／Linux 真實來源尚未驗證。

階段 1 待替換的 bridge 呼叫包括：設定 get／set；open／save dialogs；圖片掃描；檔案建立、複製、搬移、刪除、覆寫、存在檢查、JSON 寫入、開啟資料夾；DB connect／save／deepSave／slice／get／pullDockings；視窗操作、開啟網址、版本與平台資訊。

階段 1 不應加入新介面的舊方法：`Database-Find`（未使用且函式不能經 IPC 複製）、`Wraping`（未使用且無主程序 handler）、通用 `Glob`（UI 改用 scanImages）。Electron 舊 bridge 暫時保留，以便回退。

## 驗證結果與操作清單

| 操作／檢查 | 本輪結果 |
| --- | --- |
| 前端、main、preload 完整建置 | 通過；保留既有大型 chunk 提示 |
| 三個 TypeScript targets | 通過 |
| lint | exit 0、0 errors；保留既有 warnings，不宣告 warning-free |
| 正常／空白／legacy／損毀 JSON 與未知欄位、ID 保存 | 真正 Electron IPC 測試通過 |
| 主資料夾掃描、巢狀／特殊字元／重複檔名、一／二／五種副檔名 | 通過；Electron 延用區分大小寫、不含 dotfiles 的 glob 行為；排序與符號連結行為待階段 3 明確定義 |
| 深層分類儲存、重新讀取 | IPC 通過 |
| 複製、搬移、目的目錄建立、衝突、刪除、legacy overwrite | 暫存檔案操作通過；沒有驗證跨磁碟與無權限情境 |
| 首次啟動預設設定、設定持久化、重新載入專案清單 | 通過；真正結束程序再重啟仍待補驗 |
| Projects／Settings／About、Grid／VirtualList／VirtualGrid／Focus 圖片顯示、DevTools 預設關閉 | 建置版與 Vite 開發版通過；現有原始碼沒有獨立 ListView 路由，五種模式差異需在階段 3 釐清 |
| 專案新增／匯入／編輯／移除、native dialogs、Portal 新增／排序、快捷鍵、外部拖入、標題列視窗操作、大圖預覽、完整批次 UI | 尚待逐項手動驗證；不得勾選全部功能等價 |

同機匿名小資料集的測試視窗基線（單次取樣，不代表安裝版冷啟動或大型圖片效能）：真正 production main 至頁面 ready 551 ms、掃描 6.5 ms、主程序 RSS 約 101 MiB；Vite 首次頁面 ready 約 6–8 秒、掃描約 4–11 ms、測試主程序 RSS 約 80–82 MiB。兩種測試入口不同，不能直接比較其記憶體。主程序記憶體不包含 renderer／GPU，後續需補全程序與較大型同資料集測量。

## 後續門檻

階段 0 已保存操作清單、資料格式與可重現測試。下一階段建立 DesktopApi 與 Electron adapter，替換 useElectron、原生 dialog 回傳值、File.path 與圖片協定使用入口。

已盤點而尚未修正的資料風險：DB 仍有全域連線，延遲任務可能跨專案寫入；批次隊列仍會提前從 UI 移除待處理項目，idle 清理可能包含失敗檔；legacy override 在 copy 衝突選項仍會搬移來源。這些依階段 4 修正並補失敗與併發測試。

回退：使用 Git 還原本輪原始碼與 lockfile 變更，再安裝依賴；使用者資料未被遷移。測試資料只存在於測試期的暫存目錄，原始匿名模板保留於 repository。
