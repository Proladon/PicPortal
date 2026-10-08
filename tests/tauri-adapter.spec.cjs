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
    assert.throws(() => useDesktop(), /DESKTOP_UNAVAILABLE/)
    global.window = { crypto: require('crypto').webcrypto, devicePixelRatio: 2 }
    assert.throws(() => useDesktop(), /DESKTOP_UNAVAILABLE/, 'A plain browser must not get a desktop adapter')
    global.isTauri = true
    mockWindows('main')
    const commands = []
    let sessionIndex = 0
    let finishSave
    const pendingSave = new Promise(resolve => { finishSave = resolve })
    mockIPC((command, payload) => {
      commands.push([command, payload])
      if (command === 'preferences_init') return { completed: true, addedProjects: 1 }
      if (command === 'preferences_get') return payload.key === 'projects' ? [] : null
      if (command === 'preferences_import') return null
      if (command === 'preferences_set') return pendingSave
      if (command === 'desktop_open_folder') return 'ok'
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
        return { session: String(++sessionIndex), data: { id: 'old-id', mainFolder: '', portals: [], dockings: [], extra: true } }
      }
      if (command === 'desktop_save_dialog') return payload.options.title === 'cancel' ? null : 'new.db'
      if (['project_save', 'project_slice', 'project_pull_dockings', 'file_delete'].includes(command)) return 'success'
      if (command === 'file_transfer' && payload.destination === 'conflict') throw { code: 'FILE_EXIST' }
      if (command === 'project_source') return null
      if (command === 'project_set_source') return { name: '圖片', path: dataset.source }
      if (command === 'project_get') return ['old-id']
      if (command === 'file_exists') return payload.path !== 'missing'
    }, { shouldMockEvents: true })
    window.__TAURI_INTERNALS__.convertFileSrc = (file) => `asset://${encodeURIComponent(file)}`
    const desktop = useDesktop()
    assert.strictEqual(useDesktop(), desktop)
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
    assert.deepEqual(commands.map(([command]) => command), ['runtime_platform', 'plugin:app|tauri_version', 'preferences_init', 'plugin:app|version', 'plugin:window|minimize', 'plugin:window|toggle_maximize', 'plugin:window|start_dragging', 'plugin:opener|open_url', 'plugin:window|close'])
    assert.equal(desktop.toImageUrl(), '')
    assert.equal(desktop.toImageUrl(dataset.image), `asset://${encodeURIComponent(dataset.image)}`)
    assert.equal(desktop.database.readOnly, false)
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
    assert.equal(await desktop.browserDialog.save({ title: 'cancel' }), null)
    assert.equal(await desktop.browserDialog.save(), 'new.db')
    const bound = desktop.captureProject()
    await desktop.database.connect('normal.db')
    await bound.database.deepSave('[dockings][0][portals]', '[]')
    assert.deepEqual(commands.at(-1), ['project_save', { keys: ['dockings', '0', 'portals'], data: '[]', session: '1' }])
    await desktop.database.save('dockings', '[]')
    assert.equal(commands.at(-1)[1].session, '2')
    assert.deepEqual(await desktop.fileSystem.moveFile('a', 'conflict'), [null, 'FILE_EXIST'])
    await bound.fileSystem.overrideFile('a', 'b', 'copy')
    assert.deepEqual(commands.at(-1), ['file_transfer', { source: 'a', destination: 'b', moveSource: false, overwrite: true, session: '1' }])
    await desktop.fileSystem.moveFile('a', 'b')
    assert.deepEqual(commands.at(-1), ['file_transfer', { source: 'a', destination: 'b', moveSource: true, overwrite: false, session: '2' }])
    await desktop.fileSystem.createFile('new.db')
    await desktop.fileSystem.writeJson('new.db', { id: 'new' })
    assert.deepEqual(commands.at(-1), ['project_create', { path: 'new.db', data: { id: 'new' } }])
    assert.equal(desktop.migration.completed, true)
    assert.deepEqual(await desktop.userStore.get('projects'), [])
    assert.equal(await desktop.importLegacySettings(), null)
    let saved = false, idle = false
    const saving = desktop.userStore.set('projects', []).then(() => { saved = true })
    const waiting = desktop.whenIdle().then(() => { idle = true })
    await Promise.resolve()
    assert.equal(saved, false); assert.equal(idle, false)
    finishSave()
    await saving; await waiting
    assert.equal(saved, true); assert.equal(idle, true)
    let drops = []
    const stopDrop = await desktop.onFileDrop(drop => drops.push(drop))
    const payload = { paths:[{path:dataset.source,directory:true}],x:400,y:200,time:Date.now() }
    await window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event:'desktop-file-drop',payload })
    assert.equal(drops.length,1);assert.equal(drops[0].x,200);assert.equal(drops[0].y,100)
    stopDrop()
    await window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event:'desktop-file-drop',payload })
    assert.equal(drops.length,1, 'Unsubscribe must prevent duplicate handling')
    let closes = 0
    const stopClose = await desktop.onCloseRequested(() => { closes++ })
    await window.__TAURI_INTERNALS__.invoke('plugin:event|emit',{event:'desktop-close-requested',payload:null})
    assert.equal(closes,1)
    stopClose()
    await window.__TAURI_INTERNALS__.invoke('plugin:event|emit',{event:'desktop-close-requested',payload:null})
    assert.equal(closes,1)
    await desktop.appWindow.finishClose()
    assert.equal(commands.at(-1)[0],'desktop_finish_close')
    clearMocks()
    console.log('PASS Tauri adapter: runtime selection, initialization, window controls, versions, URLs, persistence barrier, native drops and close lifecycle')
  } finally {
    delete global.window
    delete global.isTauri
    await removeDataset(dataset.root)
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
