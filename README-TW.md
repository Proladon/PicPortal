# Picnel.io-3

> ⚠️ ⚠️ ⚠️ 注意: 該專案目前正處於完全早期開發階段 !

This is [Picnel.io-2](https://github.com/Proladon/Picnel.io-2) next version.

---

### 開發動機

[Picnel.io-2](https://github.com/Proladon/Picnel.io-2) 是我第一個開發的 electron 應用，而且當時是我初學 Vue 的時候。效能結構都非常的糟，且長期使用下來，我自己也發現有些操作設計上不夠好，像是多選模式，雖然可以一次處理多張圖片，但是一次只能操作單一目的資料夾，假設已選 100 張圖片中，其中 20 張你突然想換目的資料夾，你只能全部取消選取並重新選取這 20 張。

---

## Features

> ... 待更新

## Tauri 2 遷移

Tauri 已支援舊專案、圖片瀏覽、分類與批次檔案操作、設定匯入與單一實例。目前進行階段 6 的 CI／安裝包驗證；原生外部拖入延期驗收、自動更新尚未設定，Electron 回退入口保留。

使用 Node 22 以上與 npm 10 以上執行 `npm ci`；Windows 需要 Rust 1.90 以上、MSVC C++ 建置工具與 WebView2。CI 固定 Node 24.12.0、Rust 1.97.1 及 Windows Server 2022。

- Electron：`npm run dev:electron`／`npm run build:electron`，仍可作為比對入口。
- Tauri：`npm run dev:tauri`；`npm run build:installer` 建立 Windows x64 NSIS release 安裝包，位於 `src-tauri/target/release/bundle/nsis/`。
- 安裝名稱為 **PicPortal Tauri**，使用目前使用者模式，與 Electron 的 PicPortal 安裝名稱及設定目錄分開。安裝包目前沒有程式碼簽章；缺少 WebView2 時需連網下載。
- 自動測試：`npm test`；安裝／解除安裝驗證：`npm run test:tauri-installer`。兩者使用匿名資料與唯一 smoke 識別碼，無須操作原生 picker；原生 picker／外部拖入仍有獨立手動驗收入口。

檢查指令：`npm run typecheck`、`npm run lint`、`npm run test:desktop`、建置後執行 `npm run test:baseline`。詳見 [遷移計畫](docs/tauri-2-migration-plan.md)與 [實作紀錄](docs/tauri-2-migration-progress.md)。

Tauri 檢查：`npm run test:tauri-adapter`、`npm run test:tauri-skeleton`、`npm run test:tauri-skeleton:built`。原生 smoke 限 Windows／Node 22 以上，使用隔離的暫存 WebView profile；開發測試需空出 `127.0.0.1:5173`。

版本只修改根目錄 `package.json`，再執行 `npm run version:sync` 與 `npm run version:check`。GitHub 的 **Tauri release draft** workflow 需手動啟動，通過檢查後建立 `v<version>` 草稿；不會正式發布，也不會產生未簽章的更新 manifest。安裝、資料匯入與回退步驟見 [Windows 交付說明](docs/tauri-windows-release.md)。

[vite]: https://github.com/vitejs/vite/
[electron]: https://github.com/electron/electron
[electron-builder]: https://github.com/electron-userland/electron-builder
[vue]: https://github.com/vuejs/vue-next
[vue-router]: https://github.com/vuejs/vue-router-next/
[typescript]: https://github.com/microsoft/TypeScript/
[spectron]: https://github.com/electron-userland/spectron
[vue-tsc]: https://github.com/johnsoncodehk/vue-tsc
[eslint-plugin-vue]: https://github.com/vuejs/eslint-plugin-vue
[cawa-93-github]: https://github.com/cawa-93/
[cawa-93-sponsor]: https://www.patreon.com/Kozack/
