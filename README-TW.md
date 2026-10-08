# Picnel.io-3

> ⚠️ ⚠️ ⚠️ 注意: 該專案目前正處於完全早期開發階段 !

This is [Picnel.io-2](https://github.com/Proladon/Picnel.io-2) next version.

---

### 開發動機

[Picnel.io-2](https://github.com/Proladon/Picnel.io-2) 是我第一個開發的 electron 應用，而且當時是我初學 Vue 的時候。效能結構都非常的糟，且長期使用下來，我自己也發現有些操作設計上不夠好，像是多選模式，雖然可以一次處理多張圖片，但是一次只能操作單一目的資料夾，假設已選 100 張圖片中，其中 20 張你突然想換目的資料夾，你只能全部取消選取並重新選取這 20 張。

---

## Features

> ... 待更新

## 開發

PicPortal 使用 [Tauri 2][tauri]，Electron 已於遷移階段 7 移除。舊 Electron 版的設定仍可在專案頁匯入。自動更新尚未設定，原生外部拖入延期驗收。

使用 Node 22 以上與 npm 10 以上；Windows 需要 Rust 1.90 以上、MSVC C++ 建置工具與 WebView2。CI 固定 Node 24.12.0、Rust 1.97.1 及 Windows Server 2022。

- 安裝依賴：`npm ci`
- 開發啟動（Vite HMR）：`npm run dev`
- 檢查：`npm run typecheck`、`npm run lint`、`npm test`
- 建置安裝包：`npm run build:installer`，產物位於 `src-tauri/target/release/bundle/nsis/`

使用 pnpm 11 時，可執行 `pnpm install`／`pnpm tauri dev`。`pnpm-workspace.yaml` 已允許 esbuild、vue-demi 的安裝腳本。CI 仍以 npm lockfile 為基線。

- 安裝名稱為 **PicPortal Tauri**，使用目前使用者模式。安裝包目前沒有程式碼簽章；缺少 WebView2 時需連網下載。
- `npm test` 包含 adapter、批次契約與嵌入前端的 release smoke；安裝／解除安裝驗證：`npm run test:tauri-installer`。兩者使用匿名資料與唯一 smoke 識別碼，無須操作原生 picker；原生 picker／外部拖入仍有獨立手動驗收入口。
- 其他原生 smoke：`npm run test:tauri-skeleton`、`npm run test:tauri-skeleton:built`。限 Windows／Node 22 以上，使用隔離的暫存 WebView profile；開發測試需空出 `127.0.0.1:5173`。

詳見 [遷移計畫](docs/tauri-2-migration-plan.md)與 [實作紀錄](docs/tauri-2-migration-progress.md)。

版本只修改根目錄 `package.json`，再執行 `npm run version:sync` 與 `npm run version:check`。GitHub 的 **Tauri release draft** workflow 需手動啟動，通過檢查後建立 `v<version>` 草稿；不會正式發布，也不會產生未簽章的更新 manifest。安裝、資料匯入與回退步驟見 [Windows 交付說明](docs/tauri-windows-release.md)。

[vite]: https://github.com/vitejs/vite/
[tauri]: https://github.com/tauri-apps/tauri
[vue]: https://github.com/vuejs/vue-next
[vue-router]: https://github.com/vuejs/vue-router-next/
[typescript]: https://github.com/microsoft/TypeScript/
[vue-tsc]: https://github.com/johnsoncodehk/vue-tsc
[eslint-plugin-vue]: https://github.com/vuejs/eslint-plugin-vue
[cawa-93-github]: https://github.com/cawa-93/
[cawa-93-sponsor]: https://www.patreon.com/Kozack/
