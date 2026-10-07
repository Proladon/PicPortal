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

已開始建立資料基線，目前仍以 Electron 執行。使用 `npm ci` 安裝，`npm run watch` 開發，`npm run build` 建置。

檢查指令：`npm run typecheck`、`npm run lint`、建置後執行 `npm run test:baseline`。詳見 [遷移計畫](docs/tauri-2-migration-plan.md)與 [實作紀錄](docs/tauri-2-migration-progress.md)。

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
