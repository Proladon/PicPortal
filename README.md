<h1 align="center">PicPortal</h1>

![preview](https://i.imgur.com/qJXKAhT.png)

[中文 Readme](https://github.com/Proladon/Picnel.io-3/blob/master/README-TW.md)
> ⚠️ ⚠️ ⚠️ WARNING: This project is fully in early development !

This is [Picnel.io-2](https://github.com/Proladon/Picnel.io-2) next version.

---

### Motivation

[Picnel.io-2](https://github.com/Proladon/Picnel.io-2) is my first electron app and was developed when I'm a beginner for Vue. Performance and Structure are quite terrible, and for long times used I aware some operation is not fast enough. For example like multiple select mode, it still can only tag one tag for the photo, if you want to change the tag of a specific photo, you need to deselect all of the selected photos.

---

## Features

> ... wait for update

## Development

PicPortal runs on [Tauri 2][tauri]. Electron was removed; settings from the old Electron app can still be imported from the Projects page. Automatic updates are not configured yet and native OS drop acceptance is deferred.

Use Node 22+, npm 10+, Rust 1.90+, MSVC C++ build tools and WebView2 on Windows.

- `npm ci` install dependencies
- `npm run dev` start the app with Vite HMR
- `npm run typecheck`, `npm run lint`, `npm test` check the code
- `npm run build:installer` build the Windows NSIS installer

The installer is named **PicPortal Tauri** and is currently unsigned. See the [Windows release guide](docs/tauri-windows-release.md) and [migration progress](docs/tauri-2-migration-progress.md).

[vite]: https://github.com/vitejs/vite/
[tauri]: https://github.com/tauri-apps/tauri
[vue]: https://github.com/vuejs/vue-next
[vue-router]: https://github.com/vuejs/vue-router-next/
[typescript]: https://github.com/microsoft/TypeScript/
[vue-tsc]: https://github.com/johnsoncodehk/vue-tsc
[eslint-plugin-vue]: https://github.com/vuejs/eslint-plugin-vue
[cawa-93-github]: https://github.com/cawa-93/
[cawa-93-sponsor]: https://www.patreon.com/Kozack/
