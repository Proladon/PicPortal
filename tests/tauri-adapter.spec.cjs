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
    const before = commands.length
    for (const operation of [() => desktop.userStore.get('projects'), () => desktop.userStore.set('projects', []), () => desktop.browserDialog.open(), () => desktop.scanner.scanImages(dataset.source, ['png'])]) {
      await assert.rejects(operation, (error) => error.code === 'NOT_IMPLEMENTED')
    }
    for (const operation of [() => desktop.database.connect('sample.db'), () => desktop.fileSystem.createFile('sample.db'), () => desktop.fileSystem.moveFile('a', 'b')]) {
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
