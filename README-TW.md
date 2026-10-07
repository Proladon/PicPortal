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

已建立資料基線、桌面 API 抽象與 Tauri 2 執行骨架。使用 `npm ci` 安裝前端依賴；Tauri 需要 Rust 1.90 以上、Windows C++ 建置工具與 WebView2。本機以 Rust 1.97.1 驗證。

- Electron：`npm run dev:electron`／`npm run build:electron`，仍可作為比對入口。
- Tauri：`npm run dev:tauri`；`npm run build:tauri -- --debug --no-bundle` 建立含正式前端產物的測試執行檔。安裝包驗收安排於階段 6。
- 骨架目前支援視窗操作、版本／平台資訊與外部網址；專案、圖片掃描、設定與檔案處理會顯示 `NOT_IMPLEMENTED`，待後續階段接上。

檢查指令：`npm run typecheck`、`npm run lint`、`npm run test:desktop`、建置後執行 `npm run test:baseline`。詳見 [遷移計畫](docs/tauri-2-migration-plan.md)與 [實作紀錄](docs/tauri-2-migration-progress.md)。

Tauri 檢查：`npm run test:tauri-adapter`、`npm run test:tauri-skeleton`、`npm run test:tauri-skeleton:built`。原生 smoke 限 Windows／Node 22 以上，使用隔離的暫存 WebView profile；開發測試需空出 `127.0.0.1:5173`。

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
