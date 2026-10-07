# Tauri 2 遷移實作紀錄

更新日期：2026-10-07（台灣時間）。已完成階段 0 基線、階段 1 API 抽象及階段 2 Tauri 執行骨架。Electron 開發、建置與發布入口保留；專案讀寫與設定等 Tauri 功能仍待後續階段接上。

提交方式：`refactor` 分支，每階段各一個 commit；提交不代表尚未執行的手動驗收已完成。階段 0 已提交為 `cef0b6f`，階段 1 專門記錄桌面 API 抽象。

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
npm run test:desktop
npm run test:baseline
node tests/electron-baseline.cjs --development
```

`test:desktop` 驗證 adapter 契約。`test:baseline` 載入真正的 main 建置入口／preload／IPC，攔截測試視窗的 show 以保持隱藏，使用 `%TEMP%/picportal-migration-*` 資料副本與獨立 userData；結束後只清除經路徑驗證的測試目錄。開發模式另用隱藏視窗與真正 IPC 啟動並關閉 Vite server，未載入 production main 入口。測試不寫入使用者的專案或原始設定。

## 原始基線問題與本輪處理

| 問題 | 結果 |
| --- | --- |
| npm peer 衝突、沒有 lockfile | 已修復，新增可重現的 npm 安裝基礎 |
| main 建置不認得 `node:path` 等 builtin imports | main／preload external 清單涵蓋 `node:` 前綴，完整建置通過 |
| main／preload 的 Low 泛型、空值與 platform 型別錯誤；renderer 多處型別錯誤 | 修正資料實際型別、clone 泛型、必要 props、元件參數與空值分支，保留 strict 檢查 |
| lint 包含建置產物、全域 TS 型別被 `no-undef` 誤判、既有分號與未使用 slot 變數 | 忽略生成檔；TS 名稱解析交由編譯器；修正既有 lint errors。仍有既有排版／any／未使用 import warnings |
| 初次啟動直接讀取不存在的 settings | 統一建立預設設定，等待持久化完成；首次建立專案不再提前 return 而漏掉 UI refresh |
| 首次主題初始化早於 stylesheet 載入，Naive UI 收到空顏色 | 設定主題後等待頁面 load，再取得 CSS variables |
| 兩種副檔名沒有 glob 分支；資料夾路徑被當 glob pattern | 新增 `scanner.scanImages()`，Electron 後端使用 literal cwd；一／二／多種副檔名與括號、中文、空白、`#`、`%`、方括號路徑通過 |
| 圖片 URL 直接串接，裸 `%` 可能造成 decode 例外、`#` 可能截斷路徑 | 統一入口編碼路徑，保留 `local-resource` 協定；主程序 decode 改在 try 內，特殊字元圖片在四個瀏覽路由均確認 naturalWidth > 0 |
| preload `set`、`clear`、視窗方法沒有回傳 IPC Promise | 回傳 Promise，adapter 等待完成後才回覆 |
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

階段 5 優先找 `%APPDATA%/PicPortal/config.json`，找不到提供手動選檔。只讀來源，保留 `projects`、`settings` 與未知欄位；新設定已存在時不可直接覆蓋。匯入成功持久化後才標記，重試依 ID／path 避免重複。macOS／Linux 真實來源尚未驗證。

使用中的 bridge 全部透過 `DesktopApi`：設定 get／set；open／save dialogs；圖片掃描；檔案建立、複製、搬移、刪除、覆寫、存在檢查、JSON 寫入、開啟資料夾；DB connect／save／deepSave／slice／get／pullDockings；視窗操作、開啟網址、版本與平台資訊。

不加入新介面的舊方法：`Database-Find`（未使用且函式不能經 IPC 複製）、`Wraping`（未使用且無主程序 handler）、通用 `Glob`（UI 改用 scanImages）。Electron 舊 bridge 暫時保留，以便回退。

## 驗證結果與操作清單

| 操作／檢查 | 本輪結果 |
| --- | --- |
| 前端、main、preload 完整建置 | 通過；保留既有大型 chunk 提示 |
| 三個 TypeScript targets | 通過 |
| lint | exit 0、0 errors；保留既有 warnings，不宣告 warning-free |
| 初始化順序、取消 dialog、選檔／選資料夾格式、FILE_EXIST、IPC 拒絕、設定 Promise、圖片 URL、HTML drop paths | adapter 契約測試通過 |
| 正常／空白／legacy／損毀 JSON 與未知欄位、ID 保存 | 真正 Electron IPC 測試通過 |
| 主資料夾掃描、巢狀／特殊字元／重複檔名、一／二／五種副檔名 | 通過；Electron 延用區分大小寫、不含 dotfiles 的 glob 行為；排序與符號連結行為待階段 3 明確定義 |
| 深層分類儲存、重新讀取 | IPC 通過 |
| 複製、搬移、目的目錄建立、衝突、刪除、legacy overwrite | 暫存檔案操作通過；沒有驗證跨磁碟與無權限情境 |
| 首次啟動預設設定、設定持久化、重新載入專案清單 | 通過；真正結束程序再重啟仍待補驗 |
| Projects／Settings／About、Grid／VirtualList／VirtualGrid／Focus 圖片顯示、DevTools 預設關閉 | 建置版與 Vite 開發版通過；現有原始碼沒有獨立 ListView 路由，五種模式差異需在階段 3 釐清 |
| 專案新增／匯入／編輯／移除、native dialogs、Portal 新增／排序、快捷鍵、外部拖入、標題列視窗操作、大圖預覽、完整批次 UI | 尚待逐項手動驗證；不得勾選全部功能等價 |

同機匿名小資料集的測試視窗基線（單次取樣，不代表安裝版冷啟動或大型圖片效能）：真正 production main 至頁面 ready 551 ms、掃描 6.5 ms、主程序 RSS 約 101 MiB；Vite 首次頁面 ready 約 6–8 秒、掃描約 4–11 ms、測試主程序 RSS 約 80–82 MiB。兩種測試入口不同，不能直接比較其記憶體。主程序記憶體不包含 renderer／GPU，後續需補全程序與較大型同資料集測量。

## 階段 1 實作與後續門檻

`packages/renderer/src/desktop/` 已提供 DesktopApi、Electron adapter、錯誤轉換、同步 lazy 初始化與 Tauri adapter 預留說明。Vue 元件與 store 已替換全部 `useElectron()`；只有 adapter selection 存取 `window.electron`，圖片 URL 與 dialog 原生回傳結構集中於 adapter。`File.path` 也集中於 Electron adapter，Tauri 原生拖入在階段 5 實作。

階段 1 的完整手動操作驗收仍待補齊；階段 2 依使用者「繼續下個階段」指示進行，保留 Electron 自動基線作為回退與比對。安裝包與更新流程尚未驗收。

已盤點而尚未修正的資料風險：DB 仍有全域連線，延遲任務可能跨專案寫入；批次隊列仍會提前從 UI 移除待處理項目，idle 清理可能包含失敗檔；legacy override 在 copy 衝突選項仍會搬移來源。這些依階段 4 修正並補失敗與併發測試。

## 階段 2：Tauri 執行骨架

### 實作範圍

- 新增 `src-tauri/` 的 Cargo 專案、建置腳本、Windows 圖示、無框視窗、CSP 與 `main` capability；Rust command 目前僅有唯讀的 `runtime_platform`。
- 固定 Tauri Rust／JS API／CLI 2.12.1、tauri-build 2.7.1、opener 2.7.0、dialog 2.8.1；納入 `Cargo.lock` 與前端 lockfile。以 crates.io 的穩定版本選取，未採用 search 結果中的 3.0 alpha。
- `tauri.ts` 實作 initialize、應用版本與 Tauri 版本 API、平台資訊、視窗最小化／最大化切換／關閉／開始拖曳、opener URL 與 convertFileSrc。`useDesktop()` 依 `isTauri()` 選取執行環境，Vue 掛載前完成初始化。
- 尚未接上的設定、專案清單、對話框、掃描、專案讀寫、檔案處理與原生拖入回傳 `NOT_IMPLEMENTED`。UI 保留路由與標題列，顯示錯誤、解除 loading；設定未成功載入時不提供儲存，不建立假設定或專案。
- `TitleBar` 經 adapter 呼叫拖曳；按鈕區域停止 mousedown 傳遞。Electron 延用原 CSS 拖曳。
- About 改為依實際 runtime 顯示平台／版本；Electron 也使用 `app.getVersion()`，不再呼叫 simple-git。未使用的套件留待階段 7 清理。
- 專案版本設定為 0.1.0；Tauri config 引用根目錄 package.json，Cargo 版本同步為 0.1.0。Electron 安裝包仍使用 builder 的日曆版本，發布與更新來源統一留待階段 6。

### 開發與建置入口

```powershell
npm ci
npm run dev:electron
npm run build:electron
npm run dev:tauri
npm run build:tauri -- --debug --no-bundle
```

Tauri 使用 `http://127.0.0.1:5173` 與既有 `packages/renderer/dist`，保留 `/@/` alias 與根目錄環境載入。5173 必須可用，Vite 設定 strictPort；原先試用的 1420 位於這台 Windows 的 TCP 排除範圍而產生 EACCES，因此改用 5173。依 [Tauri Vite 整合文件](https://v2.tauri.app/start/frontend/vite/)調整 WebView targets，Tauri build 不使用 Node builtin external；忽略 Rust 目錄的前端 watcher。

### 存取限制

capability 限定 `main` 視窗，可讀應用／Tauri 版本並操作基本視窗；opener 僅允許目前 About 使用的 `https://github.com/Proladon` 與其子路徑。dialog 已註冊，尚未授予 UI 選檔權限或接入 adapter，留待階段 3。

asset protocol 啟用但 scope 為空，不允許任意本機圖片；檔案 commands 仍未建立。階段 3 須由後端驗證專案與使用者選取路徑，分別授予圖片 scope 與自訂命令讀取範圍，不能以 plugin scope 當成 Rust 檔案授權。

Windows 保留預設原生 drag-drop handler；尚未宣告外部拖入或 HTML5 排序共存可用，留待階段 5。[Tauri 設定文件](https://v2.tauri.app/reference/config/#windowconfig)指出 Windows HTML5 拖曳需另外處理 dragDropEnabled，不能直接停用後仍假設有原生事件。

### 執行環境與驗證

`tauri info` 確認 Windows 10.0.26300 x86_64、Visual Studio Community 2022 MSVC、WebView2 154.0.4258.62、Rust／Cargo 1.97.1、Node 24.6.0／npm 11.5.1。所選 Tauri 依賴宣告 Rust 1.90，Cargo 的最低版本依此設定；只以本機 Rust 1.97.1 實測。

```powershell
npm run typecheck
npm run lint
npm run test:desktop
npm run test:tauri-adapter
npm run test:tauri-skeleton
npm run test:tauri-skeleton:built
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
```

| 驗證 | 結果與界線 |
| --- | --- |
| 前端型別／lint、Rust fmt／clippy | 通過；lint 為 0 errors，仍有既有 warnings |
| Electron adapter、Tauri adapter | 通過；驗證 runtime、初始化順序、視窗命令、版本、URL、未實作錯誤與不呼叫原生資料寫入 |
| 真正 Tauri 開發視窗 | WebView2 顯示 Projects／Settings／About 與主題樣式；缺少資料功能時有 NOT_IMPLEMENTED 提示，沒有白畫面或永久 loading |
| HMR | 暫時修改 TitleBar 文字，確認更新後還原原始 bytes，且還原也即時更新 |
| 原生視窗按鈕 | 實際最大化切換兩次、最小化與關閉；getter 驗證 OS 視窗狀態，關閉後程序正常結束 |
| 標題列拖曳分流 | Tauri adapter 命令測試與實際 Vue 元件事件測試通過；標題區域會呼叫 startDragging，按鈕區域不會。未以實體滑鼠拖動驗證視窗位置 |
| 含正式前端產物的執行檔 | 在無 `.git` 的暫存 cwd 直接啟動原生 debug exe，未啟動 Vite；CSP、路由、樣式、平台／版本與視窗控制通過。不是 release profile 或安裝包驗收 |
| opener | SDK 命令契約與 scoped permission 建置通過；沒有為測試開啟使用者預設瀏覽器，外部瀏覽器實際啟動仍待手動驗證 |
| Cargo test | 編譯與測試 harness 通過，目前 0 個 Rust unit tests；核心資料／檔案整合測試留待階段 3／4 |
| Electron 回退入口 | 完整建置與隔離資料基線通過；原先 updater 初始化錯誤仍存在並保持未驗證 |

`tests/tauri-skeleton.cjs` 限 Windows／Node 22 以上，使用 [Microsoft 官方 WebView2 調試方式](https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/debug-visual-studio-code)的暫時 CDP port。視窗與 WebView profile 使用測試設定，profile 保存於 `%TEMP%/picportal-tauri-smoke-*` 供診斷，不含使用者專案或設定；原始 TitleBar 在 finally 保證還原。測試的 debug exe 會包含測試視窗設定，交付前再以預設 config 建置還原一般執行檔；測試設定不會納入應用原始碼。

macOS／Linux、實體拖曳、外部瀏覽器啟動、安裝／解除安裝、更新與所有資料功能都未宣告驗收完成。下一階段為對話框、舊專案唯讀解析、掃描、圖片 URL 與範圍授權。

回退：使用 `npm run dev:electron` 或 checkout 階段 1 commit `9c126d9` 後重新安裝依賴；使用者資料未被遷移。原始匿名模板保留於 repository。
