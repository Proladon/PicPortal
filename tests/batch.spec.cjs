const assert = require('assert/strict')
const path = require('path')
const { build } = require('esbuild')
const { createDataset, removeDataset } = require('./migration-fixtures.cjs')

async function main() {
  const dataset = await createDataset()
  try {
    const output = path.join(dataset.root, 'batch.cjs')
    await build({ entryPoints: ['packages/renderer/src/desktop/batch.ts'], outfile: output, bundle: true, platform: 'node', format: 'cjs' })
    const { processBatchItem } = require(output)
    function fixture(handler = () => [undefined, null]) {
      const calls = []
      const method = name => async (...args) => { calls.push([name, ...args]); return handler(name, ...args) }
      return { calls, desktop: { fileSystem: Object.fromEntries(['copyFile', 'moveFile', 'overrideFile', 'deleteFile'].map(name => [name, method(name)])), database: { pullDockings: method('pullDockings') } } }
    }
    const item = { target: 'C:/source/a.png', destinations: ['D:/one/a.png', 'D:/two/a.png'] }
    let f = fixture()
    assert.equal(await processBatchItem(item, f.desktop, () => { throw Error('unexpected conflict') }, () => true), 'success')
    assert.deepEqual(f.calls.map(c => c[0]), ['copyFile', 'moveFile', 'pullDockings'])
    f = fixture(name => name === 'copyFile' ? [null, 'ACCESS_DENIED'] : [undefined, null])
    await assert.rejects(() => processBatchItem(item, f.desktop, async () => ({ action: 'skip' }), () => true), /ACCESS_DENIED/)
    assert.deepEqual(f.calls.map(c => c[0]), ['copyFile'], 'Failed copies must prevent move and docking cleanup')
    f = fixture(name => name === 'copyFile' ? [null, 'FILE_EXIST'] : [undefined, null])
    let release
    const paused = processBatchItem(item, f.desktop, () => new Promise(resolve => { release = resolve }), () => true)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(f.calls.map(c => c[0]), ['copyFile'], 'No move while copy conflict is unresolved')
    release({ action: 'override' })
    await paused
    assert.deepEqual(f.calls.map(c => c[0]), ['copyFile', 'overrideFile', 'moveFile', 'pullDockings'])
    assert.equal(f.calls[1][3], 'copy', 'Copy overwrite must not move source')
    f = fixture(() => [null, 'FILE_EXIST'])
    assert.equal(await processBatchItem(item, f.desktop, async () => ({ action: 'skip' }), () => true), 'skip')
    assert.equal(f.calls.length, 1, 'Skipped sources keep dockings')
    f = fixture((name, source, destination) => name === 'moveFile' && !destination.includes('(2)') ? [null, 'FILE_EXIST'] : [undefined, null])
    assert.equal(await processBatchItem({ ...item, destinations: ['D:/one/a.png'] }, f.desktop, async () => ({ action: 'plusNum' }), () => true), 'success')
    assert.deepEqual(f.calls.filter(c => c[0] === 'moveFile').map(c => c[2]), ['D:/one/a.png', 'D:/one/a(1).png', 'D:/one/a(2).png'])
    let attempts = 0
    f = fixture(name => name === 'moveFile' ? [null, ++attempts === 1 ? 'FILE_EXIST' : 'NOT_FOUND'] : [undefined, null])
    await assert.rejects(() => processBatchItem({ ...item, destinations: ['D:/one/a.png'] }, f.desktop, async () => ({ action: 'plusNum' }), () => true), /NOT_FOUND/)
    assert.equal(attempts, 2, 'Numbering must stop on non-collision errors')
    f = fixture(name => name === 'moveFile' ? [null, 'FILE_EXIST'] : [undefined, null])
    assert.equal(await processBatchItem({ ...item, destinations: ['D:/one/a.png'] }, f.desktop, async () => ({ action: 'delete' }), () => true), 'success')
    assert.deepEqual(f.calls.map(c => c[0]), ['moveFile', 'deleteFile', 'pullDockings'])
    f = fixture(name => name === 'deleteFile' ? [null, 'ACCESS_DENIED'] : [null, 'FILE_EXIST'])
    await assert.rejects(() => processBatchItem(item, f.desktop, async () => ({ action: 'delete' }), () => true), /ACCESS_DENIED/)
    assert(!f.calls.some(c => c[0] === 'pullDockings'))
    let current = true
    f = fixture(name => { if (name === 'copyFile') current = false; return [undefined, null] })
    await assert.rejects(() => processBatchItem(item, f.desktop, async () => ({ action: 'skip' }), () => current), /STALE_PROJECT/)
    assert.deepEqual(f.calls.map(c => c[0]), ['copyFile'])
    console.log('PASS batch: copy-before-move, conflicts, skip, overwrite mode, numbering errors, delete failure, stale project and success-only cleanup')
  } finally { await removeDataset(dataset.root) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
