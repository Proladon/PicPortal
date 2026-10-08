# Tauri Windows 建置與交付

目前提供 Windows x64、目前使用者模式的 NSIS 安裝包。產品名稱為 `PicPortal Tauri`，應用識別碼仍為 `io.github.proladon.picportal`；標題列仍顯示 PicPortal。選擇不同安裝名稱是為了保留 Electron PicPortal 的預設安裝位置、捷徑與回退入口。

## 建置與自動驗證

環境：Node 22 以上、npm 10 以上、Rust 1.90 以上、MSVC C++ 工具與 WebView2。CI 固定 Node 24.12.0、Rust 1.97.1、Windows Server 2022。

```powershell
npm ci
npm run version:check
npm run typecheck
npm run lint -- --quiet
npm test
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
npm run test:tauri-installer
npm run build:installer
```

`npm test` 取代舊 Spectron 入口，包含 adapter、批次契約與嵌入前端的 release 程序。`test:tauri-installer` 另建唯一 smoke 名稱／identifier 的 NSIS 安裝包，靜默安裝到 `%TEMP%` 下的獨立目錄，從安裝後的 exe 驗證，再靜默解除安裝。所有專案及來源圖片都是匿名副本，Electron 設定來源由子程序 APPDATA 隔離；Tauri 設定由唯一 identifier 隔離。

測試透過真正的設定匯入授權已保存的專案，再點擊專案卡片，沒有測試專用授權 command，也不合成 OS 拖入事件。原生選檔、存檔 picker 與外部拖入不屬於無人值守 CI 的驗收範圍。release 沒有編譯 Tauri `devtools` feature，window config 也明確設為 `devtools: false`；CDP 只由測試子程序的 WebView2 環境變數開啟。

測試保留匿名資料、WebView profile 及隔離設定以供診斷。`PICPORTAL_TEST_REPORT_DIR` 可指定 CI 診斷輸出位置，保存 log、失敗畫面及匿名 `.db`。smoke 建置會使用暫時的應用識別，測試後務必執行 `npm run build:installer`，重建正常 identity 的交付產物。Electron 與 Tauri 共用 renderer dist，兩種建置須依序執行。

跨磁碟 Rust 測試需設定 `PICPORTAL_TEST_OTHER_VOLUME` 為與 `%TEMP%` 不同磁碟的可寫目錄；未設定不能宣告跨磁碟測試通過。Windows CI 以 workspace 所在磁碟作為目的磁碟，兩者若相同會明確失敗。

## 版本與草稿

只修改根目錄 `package.json` 的 SemVer 版本，再執行：

```powershell
npm run version:sync
npm run version:check
```

同步 Cargo.toml、Cargo.lock 中的 PicPortal 版本與前端 lockfile；Tauri 直接引用 package.json，Electron builder 亦使用同一版本。tag 使用 `v<version>`。不要繼續使用舊的日曆版本產生方式。

GitHub **Tauri Windows checks** 包含前端、Rust、release 安裝／解除安裝與 Electron 回退檢查，涵蓋 Rust、前端、lockfile、設定及 scripts 變更。

**Tauri release draft** 僅由 `workflow_dispatch` 手動啟動。它自行重跑檢查與安裝測試，再建正常產品名稱的安裝包、保存 workflow artifact，最後才建立或更新相同版本的 prerelease 草稿。已正式發布的版本拒絕修改。人工確認產物與驗收後，正式發布屬後續操作；本輪不啟動 workflow 或建立遠端 release。

## 安裝與首次遷移

1. 先備份 `.db`、來源圖片與 Portal 目的圖片；不要讓 Electron／Tauri 同時開啟同一份專案。
2. 執行 `src-tauri/target/release/bundle/nsis/PicPortal Tauri_<version>_x64-setup.exe`，安裝於目前使用者。預設資料夾名稱與捷徑為 PicPortal Tauri。
3. WebView2 已存在時直接使用；缺少時安裝器採 `downloadBootstrapper`，需要連網。本輪不移除主機 WebView2，離線首次部署與缺少 runtime 的下載分支待乾淨環境驗證。[官方安裝策略](https://v2.tauri.app/distribute/windows-installer/#webview2-installation-options)
4. 首次啟動讀取 `%APPDATA%/PicPortal/config.json`。找不到時在專案頁選「匯入 Electron 設定」；來源設定只讀，已有 Tauri 設定不直接覆蓋。
5. Tauri 設定存於 `%APPDATA%/io.github.proladon.picportal/settings.json`；開啟清單中的專案或選取 `.db`，檢查圖片、分類與批次操作，再重啟確認持久化。
6. 解除安裝不應刪除 `.db`、圖片、Electron 設定或 Tauri 設定。隔離 smoke 有檢查此行為；一般使用者桌面、不同安裝位置／舊安裝版本仍需各自驗收。

## 更新與回退

2026-10-08 使用者決定先完成 CI 與安裝包，尚未提供更新簽章公鑰／端點。updater plugin、更新產物簽章、manifest、兩版本更新與失敗情境維持未完成，不開啟自動更新。Windows 程式碼簽章也尚未設定，交付安裝包為 unsigned；Tauri 更新產物簽章與 Windows 程式碼簽章是不同設定。[官方 updater 文件](https://v2.tauri.app/plugin/updater/)

Electron → Tauri 首次切換使用安裝包與設定匯入，沒有透過 Electron updater 直接交接。Electron 的已知 `Store-Get` 重複註冊 updater 問題仍保留；CI 回退基線通過也不代表 Electron 更新已驗證。

回退可使用 `npm run dev:electron` 或階段 5 commit `39c8b78`，正式安裝時使用原 Electron 安裝包。Tauri 解除安裝後保留資料；若測試已搬移或刪除圖片，需由備份還原，單純換回應用程式不會復原檔案。

階段 6 的完整里程碑仍等待 GitHub CI 真正執行、乾淨環境／WebView2 分支、更新設定與驗收、效能比較。本輪不進入階段 7、不移除 Electron。
