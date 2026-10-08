// Exercises production IPC and Vue UI through saved-project authorization.
// Native pickers and OS drops remain separate manual acceptance checks.
const assert = require('assert/strict')
const fs = require('fs/promises')
const path = require('path')

async function exerciseCi(h) {
  const { dataset, env, evaluate, invoke, code, waitFor, chooseProject, close, start, loadedImages, imageLoaded, assetResponses } = h
  const { version, dependencies } = require('../package.json')
  const normal = path.join(dataset.root, 'normal.db')
  const original = await fs.readFile(normal)
  const legacyPath = path.join(env.APPDATA, 'PicPortal', 'config.json')
  const legacyBytes = await fs.readFile(legacyPath)
  const originalSettings = JSON.parse(legacyBytes).settings
  const metadata = await evaluate(`(async()=>{const invoke=window.__TAURI_INTERNALS__.invoke;return {os:await invoke('runtime_platform'),version:await invoke('plugin:app|version'),tauri:await invoke('plugin:app|tauri_version')}})()`)
  assert.deepEqual(metadata, { os: 'win32', version, tauri: dependencies['@tauri-apps/api'] })
  for (const route of ['about', 'settings', 'projects']) {
    await evaluate(`location.hash='#/${route}'`)
    await waitFor(() => evaluate(`!!document.querySelector('.${route}') && !document.querySelector('.n-spin-container--blur')`))
    assert.equal(await evaluate(`!!document.querySelector('.desktop-status')`), false)
  }
  assert.equal((await invoke('preferences_init')).completed, true)
  assert.equal((await invoke('preferences_get', { key: 'projects' })).length, 1)
  assert.deepEqual(await invoke('preferences_get', { key: 'settings' }), originalSettings)
  await chooseProject('normal.db')
  await waitFor(() => evaluate('$viewer.folderFiles.length===5'))
  for (const [extensions, count] of [[['png'], 3], [['PNG', 'JPG'], 5], [['png', 'jpg', 'jpeg', 'gif', 'webp'], 5]]) {
    assert.equal((await invoke('scan_images', { directory: dataset.source, extensions })).length, count)
  }
  assert.equal(await code('scan_images', { directory: dataset.root, extensions: ['png'] }), 'OUTSIDE_SCOPE')
  assert.equal(await code('file_exists', { path: path.join(dataset.root, 'config.json') }), 'OUTSIDE_SCOPE')
  const imageUrl = await evaluate(`window.__TAURI_INTERNALS__.convertFileSrc(${JSON.stringify(dataset.image)},'asset')`)
  assert.equal(await imageLoaded(imageUrl), true)
  for (const file of [normal, path.join(dataset.root, 'config.json'), path.join(dataset.source, '.隱藏.png'), path.join(dataset.source, '非圖片.txt')]) {
    const url = await evaluate(`window.__TAURI_INTERNALS__.convertFileSrc(${JSON.stringify(file)},'asset')`)
    assert.equal(await imageLoaded(url), false)
    await waitFor(() => assetResponses.has(url))
    assert.equal(assetResponses.get(url), 403)
  }
  for (const [route, selector] of [['grid-view', '.image-item img'], ['list-view', '.list-view img'], ['virtual-grid', 'section.viewer .virtual-scroll-viewer img'], ['virtual-list', 'section.virtual-view .virtual-scroll-viewer img'], ['focus-view', '.focus-item img']]) {
    await evaluate(`location.hash='#/editor/viewer/${route}'`)
    await waitFor(() => evaluate(`location.hash.endsWith('/${route}') && document.querySelectorAll(${JSON.stringify(selector)}).length===${route === 'focus-view' ? 1 : 5}`))
    await loadedImages(selector)
    if (route !== 'focus-view') assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`), 5)
    await evaluate('$viewer.filter.onlyDockings=true')
    await waitFor(() => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length===1 && document.querySelector('.tag')?.textContent.includes('收藏')`))
    await loadedImages(selector)
    await evaluate('$viewer.filter.onlyDockings=false')
    await waitFor(() => evaluate('$viewer.showFiles.length===5'))
  }
  await evaluate(`location.hash='#/editor/viewer/grid-view'`)
  await loadedImages('.image-item img')
  await evaluate(`document.querySelector('.magnifier').click()`)
  await loadedImages('.viewer-canvas img')
  await evaluate(`document.querySelector('.viewer-close').click()`)
  await waitFor(() => evaluate(`!document.querySelector('.viewer-canvas')`))
  assert.deepEqual(await fs.readFile(normal), original)
  console.log('PASS release frontend: routes, metadata, settings import, five image modes, preview and asset/command scopes')

  await fs.writeFile(normal, '{broken')
  assert.equal(await code('project_connect', { path: normal }), 'INVALID_JSON')
  await fs.writeFile(normal, original)
  const moved = `${dataset.source}-moved`
  await fs.rename(dataset.source, moved)
  try {
    await evaluate('$viewer.signal.refresh=true')
    await waitFor(() => evaluate(`$viewer.folderFiles.length===0 && document.querySelector('.desktop-status')?.textContent.includes('NOT_FOUND') && !document.querySelector('.n-spin-container--blur')`))
  } finally { await fs.rename(moved, dataset.source) }
  await evaluate('$viewer.signal.refresh=true')
  await loadedImages('.image-item img')
  console.log('PASS corrupted JSON and missing source recovery')

  await require('./tauri-write.cjs').exerciseWrites({ ...h, skipPicker: true })
  const settings = { ...originalSettings, viewer: { portalPanelPosition: 'left' } }
  await invoke('preferences_set', { key: 'settings', value: settings })
  await close()
  await start()
  assert.deepEqual(await invoke('preferences_get', { key: 'settings' }), settings)
  assert.equal((await invoke('preferences_get', { key: 'projects' })).length, 1)
  assert.equal((await invoke('preferences_init')).addedProjects, 0)
  assert.deepEqual(await fs.readFile(legacyPath), legacyBytes)
  for (const maximized of [true, false]) {
    await evaluate(`document.querySelector('.win-btn.max').click()`)
    await waitFor(() => invoke('plugin:window|is_maximized', { label: 'main' }).then(value => value === maximized))
  }
  await evaluate(`document.querySelector('.win-btn.min').click()`)
  await waitFor(() => invoke('plugin:window|is_minimized', { label: 'main' }))
  // close() goes through the native CloseRequested and frontend save barrier.
  await close()
  console.log('PASS settings persistence, migration retry, source preservation and native window close barrier')
}

module.exports = { exerciseCi }
