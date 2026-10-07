const assert = require('assert/strict')
const path = require('path')
const { build } = require('esbuild')
const { createDataset, removeDataset } = require('./migration-fixtures.cjs')

async function main() {
  const dataset = await createDataset()
  try {
    const output = path.join(dataset.root, 'tauri.cjs')
    await build({ stdin: { contents: `export { useDesktop } from './packages/renderer/src/desktop'; export { mockIPC, mockWindows, clearMocks } from '@tauri-apps/api/mocks'`, resolveDir: process.cwd(), loader: 'ts' }, outfile: output, bundle: true, platform: 'node', format: 'cjs' })
    const { useDesktop, mockIPC, mockWindows, clearMocks } = require(output)
    global.window = {}
    global.isTauri = true
    mockWindows('main')
    const commands = []
    mockIPC((command, payload) => {
      commands.push([command, payload])
      if (command === 'runtime_platform') return 'win32'
      if (command === 'plugin:app|tauri_version') return '2.12.1'
      if (command === 'plugin:app|version') return '0.1.0'
      if (command === 'desktop_open_dialog') return payload.options.title === 'cancel' ? null : [dataset.image]
      if (command === 'scan_images') {
        if (payload.directory === 'denied') throw { code: 'ACCESS_DENIED', message: '沒有讀取權限' }
        return [dataset.image]
      }
      if (command === 'project_connect') {
        if (payload.path === 'bad') throw { code: 'INVALID_JSON', message: '專案 JSON 損毀' }
        return { id: 'old-id', mainFolder: '', portals: [], dockings: [], extra: true }
      }
      if (command === 'project_source') return null
      if (command === 'project_set_source') return { name: '圖片', path: dataset.source }
      if (command === 'project_get') return ['old-id']
      if (command === 'file_exists') return payload.path !== 'missing'
    })
    window.__TAURI_INTERNALS__.convertFileSrc = (file) => `asset://${encodeURIComponent(file)}`
    const desktop = useDesktop()
    assert.equal(desktop.runtime, 'tauri')
    const first = desktop.initialize()
    assert.strictEqual(desktop.initialize(), first)
    await first
    assert.equal(desktop.platform.os, 'win32')
    assert.equal(desktop.platform.isWindows, true)
    assert.equal(desktop.platform.versions.tauri, '2.12.1')
    assert.equal(await desktop.appWindow.getAppVersion(), '0.1.0')
    await desktop.appWindow.minimum()
    await desktop.appWindow.maximum()
    await desktop.appWindow.startDragging()
    await desktop.appWindow.openExternal('https://github.com/Proladon')
    await desktop.appWindow.close()
    assert.deepEqual(commands.map(([command]) => command), ['runtime_platform', 'plugin:app|tauri_version', 'plugin:app|version', 'plugin:window|minimize', 'plugin:window|toggle_maximize', 'plugin:window|start_dragging', 'plugin:opener|open_url', 'plugin:window|close'])
    assert.equal(desktop.toImageUrl(), '')
    assert.equal(desktop.toImageUrl(dataset.image), `asset://${encodeURIComponent(dataset.image)}`)
    assert.equal(desktop.database.readOnly, true)
    assert.equal(await desktop.browserDialog.open({ title: 'cancel' }), null)
    assert.deepEqual(await desktop.browserDialog.open({ directory: true, multiple: true }), [dataset.image])
    assert.deepEqual(await desktop.scanner.scanImages(dataset.source, ['png', 'JPG']), [dataset.image])
    assert.deepEqual(commands.at(-1), ['scan_images', { directory: dataset.source, extensions: ['png', 'JPG'] }])
    await assert.rejects(() => desktop.scanner.scanImages('denied', ['png']), (e) => e.code === 'ACCESS_DENIED')
    assert.deepEqual(await desktop.database.connect('normal.db'), [{ id: 'old-id', mainFolder: '', portals: [], dockings: [], extra: true }, null])
    assert.deepEqual(await desktop.database.connect('bad'), [null, 'INVALID_JSON: 專案 JSON 損毀'])
    assert.deepEqual(await desktop.database.getSourceFolder(), [null, null])
    assert.deepEqual(await desktop.database.setSourceFolder(dataset.source), [{ name: '圖片', path: dataset.source }, null])
    assert.deepEqual(await desktop.database.get('dockings'), [['old-id'], null])
    assert.deepEqual(await desktop.fileSystem.checkExist('missing'), [false, null])
    const before = commands.length
    for (const operation of [() => desktop.userStore.get('projects'), () => desktop.userStore.set('projects', []), () => desktop.browserDialog.save()]) {
      await assert.rejects(operation, (error) => error.code === 'NOT_IMPLEMENTED')
    }
    for (const operation of [() => desktop.database.save('dockings', '[]'), () => desktop.fileSystem.createFile('sample.db'), () => desktop.fileSystem.moveFile('a', 'b')]) {
      const [value, error] = await operation()
      assert.equal(value, null)
      assert.match(error, /^NOT_IMPLEMENTED:/)
    }
    assert.throws(() => desktop.getDroppedPaths([]), (error) => error.code === 'NOT_IMPLEMENTED')
    assert.equal(commands.length, before, 'Unsupported actions must not call native commands or create fake data')
    clearMocks()
    console.log('PASS Tauri adapter: runtime selection, initialization, window controls, versions, URLs and unsupported operations')
  } finally {
    delete global.window
    delete global.isTauri
    await removeDataset(dataset.root)
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
