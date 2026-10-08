const assert = require('assert/strict')
const fs = require('fs/promises')
const path = require('path')
const { build } = require('esbuild')
const { createDataset, removeDataset } = require('./migration-fixtures.cjs')

async function main() {
  const dataset = await createDataset()
  try {
    const output = path.join(dataset.root, 'desktop.cjs')
    await build({ entryPoints: ['packages/renderer/src/desktop/index.ts'], outfile: output, bundle: true, platform: 'node', format: 'cjs' })
    const desktopModule = require(output)
    assert.throws(() => desktopModule.useDesktop(), /DESKTOP_UNAVAILABLE/)
    let openResponse = { canceled: true, filePaths: ['ignored'] }
    let saveResponse = { canceled: true, filePath: 'ignored' }
    let openOptions
    let finishSave
    const pendingSave = new Promise((resolve) => { finishSave = resolve })
    global.window = { electron: {
      platform: { platform: 'win32', isWindows: true, isMac: false, isLinux: false, versions: { electron: '18' } },
      userStore: { get: async () => null, set: () => pendingSave, remove: async () => {}, clear: async () => {} },
      browserDialog: { open: async (options) => { openOptions = options; return openResponse }, save: async () => saveResponse },
      fastGlob: { scanImages: async () => [] },
      database: { connect: async () => { throw new Error('bad JSON') }, get: async () => [null, { code: 'EACCES', message: 'denied' }] },
      fileSystem: { copyFile: async () => [null, 'FILE_EXIST'], moveFile: async () => { throw { code: 'FILE_EXIST' } }, checkExist: async () => [false, null] },
      appWindow: { close: async () => {}, minimum: async () => {}, maximum: async () => {}, openExternal: async () => {}, getAppVersion: async () => 'v1' }
    } }
    const desktop = desktopModule.useDesktop()
    assert.strictEqual(desktopModule.useDesktop(), desktop)
    assert.strictEqual(await desktop.browserDialog.open(), null)
    assert.strictEqual(await desktop.browserDialog.save(), null)
    openResponse = { canceled: false, filePaths: [dataset.source, dataset.destination] }
    assert.deepEqual(await desktop.browserDialog.open({ directory: true, multiple: true }), openResponse.filePaths)
    assert.deepEqual(openOptions.properties, ['openDirectory', 'multiSelections'])
    openResponse = { canceled: false, filePaths: [] }
    assert.strictEqual(await desktop.browserDialog.open(), null)
    saveResponse = { canceled: false, filePath: dataset.image }
    assert.strictEqual(await desktop.browserDialog.save(), dataset.image)
    saveResponse = { canceled: false }
    assert.strictEqual(await desktop.browserDialog.save(), null)
    assert.deepEqual(await desktop.fileSystem.copyFile('a', 'b'), [null, 'FILE_EXIST'])
    assert.deepEqual(await desktop.fileSystem.moveFile('a', 'b'), [null, 'FILE_EXIST'])
    assert.deepEqual(await desktop.fileSystem.checkExist('missing'), [false, null])
    assert.deepEqual(await desktop.database.connect('bad'), [null, 'bad JSON'])
    assert.deepEqual(await desktop.database.get('key'), [null, 'EACCES: denied'])
    let saved = false
    const save = desktop.userStore.set('projects', []).then(() => { saved = true })
    await Promise.resolve()
    assert.equal(saved, false)
    finishSave()
    await save
    assert.equal(saved, true)
    assert.equal(desktopModule.toImageUrl(), '')
    assert.equal(decodeURIComponent(desktopModule.toImageUrl(dataset.image).replace('local-resource://', '')), dataset.image)
    assert.equal(desktopModule.toImageUrl(dataset.image).includes('#'), false)
    assert.deepEqual(desktop.getDroppedPaths([{ path: dataset.source }, {}]), [dataset.source])
    console.log('PASS desktop contract: initialization, dialogs, errors, persistence, image URLs, drop paths')
  } finally {
    delete global.window
    await removeDataset(dataset.root)
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
