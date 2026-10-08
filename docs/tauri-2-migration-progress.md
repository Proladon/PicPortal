# Tauri 2 遷移實作紀錄

更新日期：2026-10-08（台灣時間）。階段 6 的 CI／安裝包實作與本機 release 安裝測試已完成；GitHub CI 真正執行、乾淨環境／WebView2 分支與 updater 驗收仍待完成。使用者決定先完成 CI 與安裝包，尚未設定更新簽章／端點。階段 5 外部資料夾與 `.db` 拖入仍延期、不宣告通過。Electron 開發與建置入口保留，release workflow 改為 Tauri 手動草稿；不進入階段 7。

提交方式：`refactor` 分支，按階段提交，驗收補充與收尾可另行提交；提交不代表尚未執行的手動驗收已完成。階段 0 已提交為 `cef0b6f`，階段 1 專門記錄桌面 API 抽象。

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

## 階段 3：專案唯讀開啟與圖片瀏覽

### 實作範圍

- Tauri Projects 直接開啟既有 `.db`，不依賴尚未遷移的設定／專案清單。Rust 使用 dialog plugin 的原生選檔結果建立授權；取消回傳 `null`。來源資料夾選取也走原生對話框。
- Rust 讀取並驗證 JSON，接受 `id`／舊 `project`、`mainFolder: ''` 或物件；以 `serde_json::Value` 保留未知欄位、原 ID、分類與圖片路徑。讀取、切換來源及瀏覽均不寫回 `.db`。
- 新增 `database.readOnly`、`getSourceFolder`、`setSourceFolder`。Tauri 的來源 override 只存於工作階段，既有 dockings 不清除；相對來源路徑以 `.db` 所在目錄解析，原始 JSON 不改成絕對路徑。重新開啟會恢復專案內的來源。
- 補上原先只有型別、沒有 route／元件的 List 模式，開啟既有模式切換入口；Grid、List、VirtualGrid、VirtualList、Focus 共用篩選結果。Focus 加入上一張／下一張。大圖使用既有 viewer 與 adapter URL。
- Windows 圖片路徑比對接受大小寫與斜線差異，保留舊 dockings 原文；找不到的 Portal ID 不生成空白標籤。唯讀狀態停用分類新增／修改／排序、標籤移除與批次操作，避免瀏覽觸發舊佇列清理。
- 掃描失敗會清除失效的圖片清單、顯示錯誤並結束 loading。前端檢查掃描請求序號與專案／來源，避免過期結果覆蓋切換後的圖片。

### 掃描與權限語意

副檔名支援 png、jpg、jpeg、gif、webp，大小寫不敏感，接受有／無前導句點；空列表回傳空結果，其他副檔名回傳 `INVALID_EXTENSION`。逐層列舉目錄，不把路徑當 glob。結果以 Rust 路徑字典序排序、去重；忽略點號開頭的檔案／目錄、Windows hidden attribute，以及符號連結和所有 Windows reparse points（包含 junction）。掃描錯誤不回傳部分成功清單。

原生對話框選取檔案／目錄後保存 canonical path，命令重新解析並比對，拒絕未選取或重新指向別處的路徑。專案內的來源也先驗證為可讀目錄；掃描只接受目前專案的來源根目錄，不能由前端要求掃描任意目錄。阻塞 I/O 使用 `spawn_blocking`，單一 session mutex 包含讀取、切換、掃描與授權，序列化操作。

依 [Tauri capabilities 文件](https://v2.tauri.app/security/capabilities/)以 `AppManifest.commands` 產生自訂命令 ACL，再逐項授權 `main` 視窗。未給前端 dialog／fs 的廣泛 plugin 權限；選檔由受限的自訂 command 呼叫 Rust dialog API。這也避免 JS dialog command 自動授予整個目錄的 asset scope。

asset protocol 初始 scope 仍為空。Rust 只對掃描成功、位於驗證來源內的圖片呼叫 `allow_file`，利用 Tauri scope 的字元跳脫處理中文、括號、方括號、`#`、`%`。專案 JSON、設定檔、非圖片、隱藏圖片及 Portal 目的目錄均不因選檔／選資料夾而獲得圖片權限。前端使用 `convertFileSrc` 與既有 CSP；[asset protocol 文件](https://v2.tauri.app/security/asset-protocol/)說明它與其他檔案存取範圍分開。

已由使用者核准來源並授權的「精確圖片檔」在同一程序中累積；Tauri 2.12 scope 沒有撤銷單一 allow pattern 的公開 API。本階段切換專案不擴大成整個目錄權限，Rust 檔案命令仍受目前專案限制；程序結束後，選檔與圖片權限全部重建。這不是檔案寫入權限。若未來需要在切換專案時立即撤銷已核准圖片，須另設可撤銷的圖片服務。

### 驗證紀錄

環境延用階段 2 的 Windows x86_64／WebView2、Node 24.6.0、Rust 1.97.1、Tauri 2.12.1；macOS／Linux 未驗證。

```powershell
npm run typecheck
npm run lint
npm run test:desktop
npm run test:tauri-adapter
npm run test:tauri-skeleton
npm run test:tauri-browse
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
npm run build:electron
npm run test:baseline
npm run build:tauri -- --debug --no-bundle
```

| 驗證 | 結果 |
| --- | --- |
| 前端型別、lint；Rust fmt／clippy | 通過，lint 0 errors；仍有既有格式與未使用項目的 warnings |
| Desktop／Tauri adapter | 取消、資料／錯誤格式、掃描參數、原生命令，以及未接上的寫入不呼叫 IPC，全部通過 |
| 9 個 Rust 測試 | 正常／空白／舊格式、未知欄位／ID／原始 bytes、不合法 JSON／schema、來源與檔案消失、相對來源、scope、來源 override、專案切換、大小寫副檔名、隱藏檔與 junction 排除；Windows 獨占檔案造成讀取拒絕時，原專案狀態與 bytes 保留 |
| Windows 原生瀏覽 smoke | 真正選檔、讀取 normal.db；5 種模式顯示圖片、唯讀分類標籤及篩選；特殊路徑圖片、大圖預覽都載入成功 |
| 圖片／命令權限 | 未選取專案不能 connect；不能掃描任意目錄、讀取外部設定或指定未選取來源。額外以 CDP Network 確認專案 JSON、設定、隱藏圖片及非圖片 asset 請求為 HTTP 403，而非只檢查破圖 |
| 空白專案與來源選取 | 原生資料夾對話框選來源後顯示圖片；原 `.db` 保持 `mainFolder: ''`，bytes 完全相同 |
| 錯誤與復原 | 損毀 JSON 拒絕讀取；來源移走時 UI 顯示 NOT_FOUND、清空舊圖片且不永久 loading，還原後可刷新瀏覽。ACCESS_DENIED 由 Rust 錯誤與 adapter 契約驗證；未修改使用者或系統 ACL |
| 真正程序重啟 | 重啟時原選檔與 asset 授權失效；再次原生選取同一專案後重新授權並顯示圖片，原 ID／bytes 不變 |
| 開發骨架回歸 | Vite 路由、HMR、視窗按鈕、標題列拖曳分流通過 |
| Electron 回退 | 建置與隔離基線通過；既有 updater 重複註冊 Store-Get 的錯誤仍留待階段 6 |

`tests/tauri-browse.cjs` 在無 `.git` 的暫存 cwd 直接啟動含前端產物的 debug exe，使用隔離 WebView profile 與匿名資料，無 Vite／Node sidecar。選檔必須在印出的路徑透過真實 Windows 對話框完成（手動或 computer-use），沒有測試專用的繞過授權 command；CDP 檢查原生 IPC 與 UI。此次選檔以 computer-use 完成，其餘檢查自動執行。若 CI 沒有可操作的 Windows 桌面，不能把這個互動 smoke 當成無人值守測試，階段 6 再整合。

匿名副本與 WebView profile 保留於 `%TEMP%/picportal-migration-*`、`picportal-tauri-browse-*` 供診斷；Rust unit tests 的暫存資料自動清理。未讀取或修改使用者正式專案／設定。交付前以預設 Tauri config 重建，避免測試 profile 設定留在一般 exe。

里程碑 A 已在 Windows 通過。分類與資料寫入、檔案批次處理留待階段 4；設定／專案清單持久化、外部拖入留待階段 5。這次未驗收安裝包、release profile 或更新。

回退：`npm run dev:electron`，或 checkout 階段 2 commit `b238ec3`。階段 3 未修改舊 `.db` 或使用者設定，沒有資料回退步驟。

## 階段 4：資料寫入與批次檔案處理

### 實作範圍

- 開放 Tauri 專案新增、分類儲存、深層更新、陣列刪除及 dockings 清理。新增專案透過 Rust 原生 save dialog 授權精確 `.db` 位置；`createFile` 僅驗證新位置，`writeJson` 一次提交完整空白專案，不先建立空檔。已有檔案回傳 `FILE_EXIST`，不覆蓋既有專案。
- 專案選取來源現在會持久化 `mainFolder`，並在同一次寫入清除舊 dockings。Portal 新增／改變目的地需透過原生資料夾對話框；既有專案內的目的地由後端解析，支援尚未建立的目錄與專案相對路徑，原 JSON 路徑文字不改寫。外部拖入仍待階段 5。
- JSON 保留原有 `id`／`project` 與頂層、群組、Portal、Docking 的未知欄位。以穩定 ID／target 合併 UI 未認得的欄位；分類刪除會移除該筆記錄。既有專案 ID 不可透過一般更新命令更改。
- Rust mutex 序列化 connect、scan、讀寫與圖片檔案操作；commands 的阻塞 I/O 留在 `spawn_blocking`。寫入同目錄暫存檔、`sync_all`，再使用 tempfile 在 Windows 的 `MoveFileExW` 替換流程。沒有先刪原 JSON；提交成功後才改記憶體資料。寫入前比對開啟時／上次提交的 bytes，外部修改回傳 `PROJECT_CHANGED`。
- 每次 connect 產生新的工作階段編號；`captureProject()` 在加入 DB／批次佇列前綁定介面。Rust 拒絕 `STALE_PROJECT`，包含重新開啟同一路徑。Electron adapter 也加入過期檢查，UI 等待 DB queue 後才切換連線；仍保留 Electron 後端供回退。
- 圖片 copy／move 預設不覆蓋，先寫同目的目錄暫存檔並同步，再以不覆蓋方式提交。move 統一使用複製、提交、刪來源流程，適用跨磁碟。來源 identity 改變、複製／提交失敗都不刪來源；來源刪除失敗時保留兩份完整檔案並回報失敗。相同路徑或 hardlink 回傳 `SAME_FILE`。
- 讀寫只接受目前專案 JSON、來源圖片與驗證的 Portal 圖片目的地。不存在的目的目錄固定最近既有祖先；操作前與提交前再次解析，拒絕 `..` 越界請求、符號連結、junction／reparse points 與 Windows alternate data streams。不能由前端新增任意路徑授權。複製衝突與成功目的檔只授予精確圖片 asset 權限，讓衝突預覽可顯示；不擴大為整個目的目錄。
- 前端 PQueue 逐張處理圖片：前幾個 Portal 必須複製成功後才搬到最後一個。衝突暫停該圖片；支援略過、重新命名、加序號、刪來源、覆寫與後續套用同一選項。`overrideFile` 明確傳入 copy／move；Electron 也修正 copy overwrite 誤搬來源。序號命名遇到非 `FILE_EXIST` 錯誤立即停止。
- 以「來源圖片」為進度單位：成功、失敗、略過各自計數。只在整張圖片成功或明確刪來源成功後清理該 target 的 dockings；失敗／略過保留。UI 不再預先移除圖片，結束後重新掃描實際來源；批次／衝突尚未完成時限制專案切換與分類修改。部分目的已複製但後續失敗時不自動刪掉完整副本，重試會進入既有衝突流程。

### 驗證與重現

環境延用 Windows x86_64／WebView2、Node 24.6.0、Rust 1.97.1、Tauri 2.12.1。將既有 lockfile 中的 tempfile、same-file 納入正常 Rust 依賴，未升級前端套件。

```powershell
npm run typecheck
npm run lint -- --quiet
npm run test:desktop
npm run test:tauri-adapter
npm run test:batch
npm run test:tauri-write
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
$env:PICPORTAL_TEST_OTHER_VOLUME = 'D:\Coding\Repos\Proladon\PicPortal\src-tauri\target'
cargo test --manifest-path src-tauri/Cargo.toml --locked
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
npm run build:electron
npm run test:baseline
npm run build:tauri -- --debug --no-bundle
```

跨磁碟測試環境變數必須指定與 Windows `%TEMP%` 不同磁碟的可寫目錄；本機為 C → D。測試在該目錄建立獨立 tempfile 並清理。未設定時該項不執行實際跨磁碟驗證，不能僅以測試 exit 0 宣告跨磁碟通過。

| 驗證 | 結果與界線 |
| --- | --- |
| TypeScript、lint、Rust fmt／clippy | 通過；lint 0 errors，仍保留既有格式與未使用項目的 warnings |
| Desktop／Tauri adapter、batch | 通過；驗證綁定 token、copy overwrite 模式、失敗阻止搬移、未解決衝突等待、略過保留、序號錯誤停止與清理條件 |
| 21 個 Rust 資料／檔案測試 | JSON／ID／未知欄位保存、legacy project 欄位、schema 與外部修改拒絕、新建不覆蓋、陣列刪除、複製／搬移／覆寫、hardlink、範圍、junction、過期工作階段與 12 個並行深層寫入通過 |
| Windows 鎖檔與跨磁碟 | 獨占 JSON／目的檔造成失敗時保留原 bytes；來源無刪除權限時保留兩份完整內容；實際 C → D 搬移與目的衝突保留來源通過。不修改系統或使用者 ACL |
| 真正 Tauri 程序重啟 | 分類名稱、原 ID、未知欄位與 10 個並行 IPC 寫入保存；舊 token 的寫入拒絕 |
| 原生批次 UI | 真正 WrapingButton／確認視窗、搬移結果與計數、略過、序號、copy overwrite、重新命名、目的圖片預覽與失敗保留 dockings 通過；刪來源以原生 command 及 batch 契約測試驗證 |
| 原生新專案儲存 | 真正 Rust save picker／Vue 表單建立完整 JSON 並開啟成功；新檔 ID 存在，mainFolder／portals／dockings 格式正確 |
| 圖片與檔案授權回歸 | 原生命令範圍檢查與 asset HTTP 403（JSON、設定、隱藏圖片、非圖片）通過，新增寫入沒有放寬這些範圍 |
| Electron 回退 | 建置與隔離資料基線通過；原有 updater 的 Store-Get 重複註冊問題未處理，仍留待階段 6 |

`test:tauri-write` 共用 Windows 原生 smoke harness，使用含正式前端產物的 debug exe，沒有 Vite、Git 或 Node sidecar。專案開啟／儲存對話框必須使用印出的匿名副本路徑實際選取，沒有測試專用授權 command；這次使用 computer-use 操作原生對話框，CDP 執行真實 Vue／Pinia 與 IPC 檢查。資料與隔離 WebView profile 保留供診斷，normal.db 在 finally 還原匿名模板。正式使用者的專案與設定未被修改。

### 界線與後續

- 本輪只驗證 Windows；macOS／Linux、release profile、安裝包與更新維持未驗證。設定／專案清單持久化、外部拖入、single-instance、關閉時等待批次與儲存仍屬階段 5。批次中直接關閉程序的完整復原流程尚未實作。
- 原 JSON 替換失敗不破壞原檔；不宣告作業系統斷電後的完整 durability 保證。路徑與來源 identity 在操作／提交前重驗，未驗證惡意外部程序在檢查與系統呼叫間持續競態替換檔案的情境。
- 圖片授權延用階段 3 的程序內精確檔案累積語意；程序結束後重建。設定檔、專案 JSON 與任意目錄不取得圖片或寫入權限。
- 回退使用 `npm run dev:electron` 或階段 3 commit `fc7d503`。JSON 格式仍相容；在正式專案套用前先複製 `.db` 與圖片目錄。已搬移／刪除的圖片不能只靠退回程式碼復原，須由資料副本還原。

里程碑 B 已在 Windows 通過；下一階段為設定遷移與完整互動整合。交付前以預設 Tauri config 重建，移除 smoke 的隔離 profile 設定。

## 階段 5：設定遷移與互動整合

### 實作範圍

- 固定 Rust store plugin 2.5.0 與 single-instance plugin 2.5.2，沿用 Tauri 2.12.1。設定存放於應用識別碼對應的 app data 目錄 `settings.json`；只透過自訂 commands 讀寫，沒有開放前端任意 store／檔案路徑權限。
- store plugin 的直接儲存會截斷檔案，因此先儲存 `.settings.pending.json`，再以階段 4 的同目錄暫存／同步／替換流程提交正式設定。失敗恢復 plugin cache 並保留原設定 bytes。外部變更回傳 `SETTINGS_CHANGED`，不覆蓋其他程式修改。
- Windows 首次啟動讀取 `%APPDATA%/PicPortal/config.json`；找不到或匯入失敗時可從專案頁手動選取 JSON。匯入保留已有設定、專案 ID／名稱與未知欄位，依清單 ID 或 Windows 路徑去重，只補缺少的資料。資料與遷移完成標記一次提交，來源檔只讀；失敗可重試。缺少設定時的 UI 預設值不先寫入，以免阻擋手動匯入舊值。
- 專案清單可持久化新增、匯入、編輯及移除；移除清單項目不刪 `.db`。重啟後由 Rust 重新驗證保存的專案路徑，不需要再次選檔。新增路徑仍須原生 picker／drop 授權；已選取路徑不因再次初始化設定而重設固定的解析結果。新的清單項目使用獨立 ID，避免不同 `.db` 副本共用內部 ID 時影響編輯／移除。
- 設定頁可保存語言、主題及 Portal 面板位置。adapter 的 `set` 等待實際持久化完成，`whenIdle` 等待尚未完成的 commands。儲存失敗保留未儲存提示並顯示錯誤。
- 外部拖入接上 Rust 原生 Drop 事件，驗證並授權實際 OS 路徑，再依座標與類型交給 `.db` 或資料夾區域；前端依 devicePixelRatio 轉換實體座標，不使用 `File.path`。DropZone 在非同步訂閱完成後仍會檢查卸載狀態，並解除 drop／error listeners，避免舊事件交給新掛載區域。
- Portal 與群組使用 Sortable fallback、滑鼠事件與指定拖曳 handle，保留原生檔案 handler；不使用 HTML5 拖曳與原生檔案 handler 互相衝突的組合。Portal 名稱停用文字選取。此方案依 [Sortable 官方說明](https://github.com/SortableJS/Sortable#forcefallback-option)，實際 WebView 指標排序及 JSON 寫回已驗證。
- single-instance 放在第一個 plugin；第二次啟動退出並還原／聚焦主實例。原生關閉先通知前端：未儲存設定可繼續、儲存後關閉或放棄修改；批次／衝突尚未結束時可等作業完成或取消關閉。完成時等待 DBQueue、adapter pending 與 Rust mutex，禁止後續 commands 才銷毀視窗。沒有強制終止正在搬移的批次。
- 資料夾開啟僅允許目前來源或 Portal 目錄，驗證固定祖先與連結。修正目錄尾端分隔符造成精確根目錄被拒絕的問題；任意專案外路徑仍拒絕。App／GridView 的快捷鍵在卸載時解除，非同步初始化完成後不再替已卸載元件綁定。

### 驗證與重現

環境延用 Windows 11／WebView2、Node 24.6.0、Rust 1.97.1、Tauri 2.12.1。

```powershell
npm run typecheck
npm run lint -- --quiet
npm run test:desktop
npm run test:tauri-adapter
npm run test:batch
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
$env:PICPORTAL_TEST_OTHER_VOLUME = 'D:\Coding\Repos\Proladon\PicPortal\src-tauri\target'
cargo test --manifest-path src-tauri/Cargo.toml --locked
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
npm run test:tauri-interactions -- --skip-os-drop
npm run build:electron
npm run test:baseline
npm run test:tauri-skeleton:built
npm run build:tauri -- --debug --no-bundle
```

| 驗證 | 結果與界線 |
| --- | --- |
| 型別、lint、Rust fmt／clippy | 通過；lint 0 errors |
| 24 個 Rust 測試 | 通過，含設定 JSON／合併／去重、精確來源／Portal 目錄開啟及實際 C → D 跨磁碟搬移回歸 |
| Desktop／Tauri adapter／batch | 通過，含設定儲存 barrier、實體座標轉換、訂閱解除、關閉契約及原有批次處理 |
| 原生設定遷移 | 真正 store plugin 與鎖檔失敗注入：正式檔保持 `{}` 且無標記；釋放鎖後重試成功，重試不重複，來源 bytes 不變 |
| 原生設定與清單 | 真正手動 JSON picker、既有設定與未知欄位保存、清單 metadata 編輯、新專案 save picker、重啟保留；直接 IPC 移除清單後 `.db` bytes 不變 |
| 單一實例與排序 | 真正程序重啟、第二次啟動退出／還原最小化；WebView 可信指標事件操作 Portal fallback 排序並驗證 JSON 次序；F2 可開啟 Commander |
| 關閉流程 | 未儲存設定關閉／取消、主題與面板儲存後關閉、語言放棄修改後關閉；批次衝突等待處理，略過保留來源與 docking，之後正常退出 |
| About／外部目錄 | 無 `.git` 的暫存 cwd 顯示版本；Rust scoped opener 啟動匿名 Portal 目錄的檔案總管，專案外路徑拒絕 |
| 嵌入前端骨架回歸 | 路由、樣式、版本、首次預設設定與最小化／最大化／關閉按鈕通過 |
| 真正外部拖入 | **完整流程未驗證、依使用者決定延期**。本輪手動資料夾拖入後清單出現一筆，但保存步驟的測試選錯按鈕，修正後不再重跑；`.db` 拖入未實測。`--skip-os-drop` 的 exit 0 不代表此項通過 |
| Electron 回退 | 建置與隔離基線通過；原有 updater 重複註冊 `Store-Get` 問題仍保留，未納入本階段修復 |

`test:tauri-interactions` 使用匿名資料與唯一 smoke identifier，在沒有 Git／Vite／Node sidecar 的暫存 cwd 啟動嵌入前端的 debug exe。真實 native picker 由 Windows Computer Use 操作，Vue／Pinia、IPC、指標／快捷鍵與檔案結果由 CDP 檢查，沒有測試專用授權 command。設定來源隔離在 `%TEMP%/picportal-tauri-browse-*/legacy-appdata/PicPortal/config.json`；Tauri KnownFolder 設定位置不跟隨子程序 APPDATA，因此正式設定以唯一 smoke identifier 隔離於主機 `%APPDATA%/io.github.proladon.picportal.smoke.*/`。匿名資料、profile 與 smoke 設定保留供診斷，normal.db 在 finally 還原；沒有修改使用者正式設定或專案。

### 尚未驗收與回退

2026-10-07 使用者決定：「拖入這兩個就先不測了，如果之後我手動操作有遇到問題再另外修正」。因此階段 5 按延期例外收尾，可進入階段 6；原生外部資料夾／`.db` 拖入維持未驗證，不再要求使用者重做手動驗收，也不將延期視為通過。

保留選用的 `npm run test:tauri-drops` 供日後重現：使用隔離匿名副本，自動開啟專案及拖入區，等待實際 OS 資料夾／`.db` 拖入，檢查 Portal 保存、精確路徑授權、清單 ID、JSON bytes、asset 範圍及重啟。此流程沒有測試專用授權 command，也不合成 drop 事件。本次使用者手動拖入後，前端資料夾清單確實出現一筆；但測試誤選 DropZone 同樣帶有 block class 的按鈕，未點到建立按鈕，之後等待 modal 關閉逾時。已修正為選取最後的 footer block 按鈕，依使用者決定不再重跑。資料夾事件接收有部分證據，Portal 保存／重啟與 `.db` 原生拖入完整流程仍未驗證。新增入口的語法、lint 檢查通過，不宣告整套原生拖入測試通過。adapter mock 的事件與座標測試亦不能取代 OS 驗收。

macOS／Linux、release profile、乾淨環境安裝包與更新未驗證，留待各平台及階段 6。交付前以預設 Tauri config 重建，避免 smoke identifier／WebView profile 留在一般 exe。

回退使用 `npm run dev:electron` 或階段 4 commit `fbce844`。Electron `config.json` 未被覆蓋；Tauri `settings.json` 使用獨立識別碼目錄。`.db` 與圖片的備份／還原方式沿用階段 4。

## 階段 6：Windows CI 與安裝包（本輪範圍）

2026-10-08 使用者確認尚未設定更新簽章／端點，先完成 CI 與安裝包。updater plugin、簽章與兩版本更新驗收留待後續，階段 6 整體里程碑 D 尚未完成。

### 實作

- `npm test` 改為 Desktop／Tauri adapter、batch 與無人值守 release smoke，移除已失效的 Spectron 測試檔。Spectron 套件隨 Electron 於階段 7 清理；Electron 建置／基線測試仍保留。
- `test:tauri-ci` 在 release profile 嵌入真正前端，以匿名 Electron config 自動匯入已保存的 `.db`，透過實際專案卡片進入五種瀏覽模式、分類／批次、重啟與設定持久化。沒有測試專用授權 IPC；不跳過 command 或 asset scope。測試修正路由切換時讀到舊 DOM 的競態，等待對應圖片數量後才驗證。
- `test:tauri-installer` 使用唯一 smoke productName／identifier 建 NSIS，安裝到 TEMP 下的獨立目錄，啟動安裝後 exe 執行同一組 release 測試，再解除安裝，檢查 app exe 被移除、Tauri 設定／匿名 Electron config／專案仍保留。原生 picker、新建專案的 save picker 與外部拖入仍由既有手動測試負責，CI 不合成 OS 選取事件。
- 正常安裝名稱改為 `PicPortal Tauri`，保留 `io.github.proladon.picportal` identifier 與 PicPortal 視窗標題；避免與 Electron 的預設安裝名稱、捷徑相同。NSIS 明確使用 `currentUser`，WebView2 缺少時採 `downloadBootstrapper`。release 未啟用 Tauri devtools feature，window config 明確關閉 devtools。
- `package.json` 作為版本來源；`version:sync` 同步 Cargo 與前端 lockfile，`version:check` 拒絕不一致與錯誤的 `v<version>` tag。Tauri 直接引用 package.json；Electron builder 改用相同版本，不再依本機日期決定發布版本。真實版本 smoke 亦不再硬編碼 `0.1.0`。
- Windows workflow 固定 Node 24.12.0、Rust 1.97.1、windows-2022，納入型別／lint、契約、Rust fmt／clippy／24 tests、跨磁碟、release 安裝流程與 Electron 回退。觸發路徑涵蓋 `src-tauri/**`、lockfiles、package、scripts 與設定。失敗上傳匿名 log、畫面與 `.db`。
- release workflow 改為手動觸發，重跑檢查、保存正常 identity 安裝包後才建立／更新 `v<version>` prerelease 草稿；拒絕修改已正式發布版本。不自動發布、不刪其他草稿、不建立未簽章的 updater manifest。未在本輪啟動遠端 workflow 或建立 release。
- 新增 [Windows 交付說明](./tauri-windows-release.md)，更新 README 與計畫中的範圍／未完成項目。

### 本機驗證

Windows 11 10.0.26300、Node 24.12.0、npm 11.6.2、Rust／Cargo 1.97.1、Tauri 2.12.1。重新 `npm ci --no-audit --no-fund` 安裝 663 packages；未升級前端依賴。

```powershell
npm ci --no-audit --no-fund
npm run version:check
npm run typecheck
npm run lint -- --quiet
npm run test:desktop
npm run test:tauri-adapter
npm run test:batch
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
$env:PICPORTAL_TEST_OTHER_VOLUME = 'K:\Coding\Repos\Proladon\PicPortal\src-tauri\target'
cargo test --manifest-path src-tauri/Cargo.toml --locked
npm run test:tauri-installer
npm run build:electron
npm run test:baseline
npm run build:installer
```

| 驗證 | 結果與界線 |
| --- | --- |
| 型別／lint／Rust fmt／clippy | 通過；lint 0 errors，仍有既有 warnings |
| Desktop／Tauri adapter／batch | 通過；Tauri adapter mock 仍會印 callback 已移除訊息，測試結果通過 |
| 新預設 `npm test` | 通過；契約後接 release 程序，確認 Spectron 替代入口可完整執行 |
| 24 個 Rust tests | 通過，包含實際 C → K 跨磁碟搬移、來源刪除失敗、鎖檔、junction、併發及設定合併 |
| release NSIS 安裝／解除安裝 | 本機隔離目錄通過；從安裝後 exe 執行，不使用 debug exe、Vite、Git 或 Node sidecar |
| 原生 release 前端與 IPC | Projects／Settings／About、五種瀏覽／篩選／標籤、大圖、特殊路徑、asset 403 與 command 範圍通過；損毀 JSON／來源消失可恢復 |
| 寫入、批次與重啟 | ID／未知欄位、10 個並行 IPC 寫入、stale token、成功清理 docking、略過／序號／copy overwrite／重新命名／失敗保留／刪來源通過；真正結束再啟動後資料保留 |
| 設定遷移與解除安裝資料 | 原始 Electron config bytes 不變、重試不新增重複專案、語意設定重啟保存；解除安裝保存 Tauri 設定與專案 |
| 版本與 workflow 語法 | 正確 tag 通過、不同版本 tag 明確拒絕；YAML／內嵌 PowerShell／actionlint 1.7.12 檢查五個修改的 workflow 通過 |
| 正常交付安裝包 | 已依正常 productName／identifier 重建 `PicPortal Tauri_0.1.0_x64-setup.exe`，約 4.34 MiB；未簽章 |
| Electron 回退 | 建置與匿名資料 baseline 通過；既有 updater 的 `Store-Get` 重複註冊訊息仍存在，未宣告更新通過 |

成功安裝 smoke 的匿名資料為 `%TEMP%/picportal-migration-z3sbGQ`，profile 為 `%TEMP%/picportal-tauri-browse-8stqbn`，設定使用唯一 `io.github.proladon.picportal.smoke.8stqbn`。測試安裝器已解除安裝；匿名資料／profile／設定保留供診斷，未修改正式使用者專案與設定。一般交付 exe 已重建，不含 smoke identifier／CDP 環境設定。

### 後續與限制

GitHub CI／草稿 workflow 尚未真正執行，不能以本機結果宣告遠端 CI 可重現。乾淨 Windows、缺少 WebView2 的下載分支、離線首次部署、一般桌面安裝位置／Electron 並存的實機驗收仍待完成。自動更新、更新簽章／Windows 程式碼簽章、兩版本更新與失敗情境、階段 0 效能比較仍未完成。外部資料夾／`.db` 拖入沿用階段 5 延期例外。

本輪依使用者指示交付 CI 與安裝包，保留 Electron；不進入階段 7。回退可使用 `npm run dev:electron` 或階段 5 commit `39c8b78`。正式套用前備份 `.db` 與所有圖片，已搬移／刪除的檔案須由備份復原。

### 2026-10-08：pnpm 開發啟動修復

- 使用者以 pnpm 11.10.0 安裝後執行 `pnpm tauri dev`，在啟動 CLI 前因 `ERR_PNPM_IGNORED_BUILDS` 中止。新增的 pnpm workspace 設定仍含 `set this to true or false` 佔位文字；改為明確允許 esbuild、vue-demi、Electron 安裝腳本，停用已退役的 Spectron／chromedriver／Puppeteer 腳本。`pnpm install --frozen-lockfile` 與必要套件 rebuild 通過，未重新解析或改寫使用者的 pnpm lockfile。
- 實際 Electron 設定中，未選顏色的舊專案保存 `color: null`。Rust 原先只接受字串，導致整份匯入回傳 `INVALID_SETTINGS`。現在接受並保留 null，其他不合法的顏色型別仍拒絕；新增匯入／重試／未知欄位保存回歸測試。真正啟動後已匯入四個原有清單項目，Electron config 的 SHA256 前後相同；沒有直接修改來源設定或專案 `.db`。
- npm 切換 pnpm 後殘留的根目錄 `@vue/reactivity`／`@vue/runtime-core` 與 pnpm 的 `vue` 是兩份模組；實測 `vue.ref`、`vue.onMounted` 與獨立模組的函式 identity 不同，造成後端清單已有資料而 Vue 畫面沒有更新。37 個前端檔案統一由宣告的 `vue` 依賴匯入公開 API，實機專案卡片恢復顯示；另補 computed title 的空字串 fallback，通過 Vue lint。
- 驗證：`pnpm tauri dev` 真正啟動 Vite／Rust／WebView2，專案頁與原有清單顯示正常，沒有 `INVALID_SETTINGS`；三個 TypeScript targets、lint、Rust fmt／clippy 與三個 preferences tests 通過。使用 computer-use 確認開發視窗，測試結束後正常關閉，釋放 5173 port。
- npm lockfile 與 CI 基線保持原設定；使用者新增的 `pnpm-lock.yaml` 保留。本次修復只更新開發原始碼，先前 stage 6 安裝包未重建；新安裝包需另執行建置。
