const assert = require('assert/strict')
const fs = require('fs/promises')
const path = require('path')

async function rendererChecks(dataset) {
  const bridge = window.electron
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const projectPath = `${dataset.root}/normal.db`
  const [data, error] = await bridge.database.connect(projectPath)
  assert(!error && data.id === 'project-001', 'Read legacy project')
  assert(data.portals[0].childs[0].id === 'portal-001', 'Preserve portal IDs')
  const scanStart = performance.now()
  const pngs = await bridge.fastGlob.scanImages(dataset.source, ['png'])
  const scanMs = performance.now() - scanStart
  const two = await bridge.fastGlob.scanImages(dataset.source, ['png', 'jpg'])
  const all = await bridge.fastGlob.scanImages(dataset.source, ['png', 'jpg', 'jpeg', 'gif', 'webp'])
  assert(pngs.length === 3 && two.length === 4 && all.length === 4, 'Scan one/two/five extensions with special characters')
  const [, corruptError] = await bridge.database.connect(`${dataset.root}/corrupt.db`)
  assert(corruptError, 'Corrupt JSON returns error')
  const [empty, emptyError] = await bridge.database.connect(`${dataset.root}/empty.db`)
  assert(!emptyError && empty.mainFolder === '', 'Read empty project')
  const [legacy, legacyError] = await bridge.database.connect(`${dataset.root}/legacy.db`)
  assert(!legacyError && legacy.project === 'legacy-001', 'Read project-key format')
  const [, missingError] = await bridge.database.connect(`${dataset.root}/missing.db`)
  // lowdb treats a missing file as null and Connect substitutes {}; document this baseline.
  assert(!missingError, 'Document missing project behavior')
  await bridge.database.connect(projectPath)
  const [, saveError] = await bridge.database.deepSave('[dockings][0][portals]', JSON.stringify([]))
  assert(!saveError, 'Deep-save project')
  const [updated] = await bridge.database.get('dockings')
  assert(updated[0].portals.length === 0, 'Deep-save persisted')
  await bridge.database.save('dockings', JSON.stringify(data.dockings))
  const [, copyError] = await bridge.fileSystem.copyFile(dataset.image, `${dataset.destination}/nested/copy.png`)
  assert(!copyError, 'Copy creates destination directory')
  const [, conflict] = await bridge.fileSystem.copyFile(dataset.image, `${dataset.destination}/nested/copy.png`)
  assert(conflict === 'FILE_EXIST', 'Conflict preserves FILE_EXIST')
  const [, moveError] = await bridge.fileSystem.moveFile(`${dataset.destination}/nested/copy.png`, `${dataset.destination}/moved.png`)
  assert(!moveError, 'Move file')
  const [sourceExists] = await bridge.fileSystem.checkExist(`${dataset.destination}/nested/copy.png`)
  assert(!sourceExists, 'Move removes source')
  const [, overrideError] = await bridge.fileSystem.overrideFile(`${dataset.destination}/moved.png`, `${dataset.destination}/overridden.png`)
  assert(!overrideError, 'Legacy override moves source')
  await bridge.fileSystem.deleteFile(`${dataset.destination}/overridden.png`)
  const [exists] = await bridge.fileSystem.checkExist(`${dataset.destination}/overridden.png`)
  assert(!exists, 'Delete file')
  await bridge.userStore.set('projects', [{ id: data.id, name: '匿名測試專案', path: projectPath, color: '#123456' }])
  const settings = await bridge.userStore.get('settings')
  assert(settings.general.theme === 'picportal', 'First launch initializes settings')
  settings.general.locale = 'tw'
  await bridge.userStore.set('settings', settings)
  return { scanMs, scannedImages: all.length }
}

async function child() {
  const { app, BrowserWindow } = require('electron')
  const dataset = JSON.parse(process.env.PICPORTAL_BASELINE_DATA)
  app.setName('PicPortal')
  const originalUserData = app.getPath('userData')
  app.setPath('userData', path.join(dataset.root, 'user-data'))
  app.disableHardwareAcceleration()
  const started = Date.now()
  const errors = []
  function observe(window) {
    window.webContents.on('console-message', (_event, level, message) => {
      if (level >= 3) {
        errors.push(message)
        console.error('Renderer:', window.webContents.getURL(), message)
      }
    })
  }
  const actualMain = !process.env.PICPORTAL_BASELINE_URL
  let win
  if (actualMain) {
    const loaded = new Promise((resolve, reject) => {
      app.once('browser-window-created', (_event, window) => {
        // Exercise the real main entry without showing a test window to the user.
        window.show = () => {}
        observe(window)
        window.webContents.once('did-finish-load', () => resolve(window))
        window.webContents.once('did-fail-load', (_event, code, description) => reject(new Error(`${code}: ${description}`)))
      })
    })
    require(path.resolve('packages/main/dist/index.cjs'))
    win = await loaded
  } else {
    require(path.join(dataset.root, 'ipc.cjs')).default()
    await app.whenReady()
    require(path.join(dataset.root, 'protocol.cjs')).registerLocalResourceProtocol()
    win = new BrowserWindow({ show: false, width: 1200, height: 600, frame: false, webPreferences: {
      contextIsolation: true, preload: path.resolve('packages/preload/dist/index.cjs')
    } })
    observe(win)
  }
  const evaluate = (fn, argument) => win.webContents.executeJavaScript(`(${fn.toString()})(${JSON.stringify(argument)})`)
  async function waitFor(fn, argument) {
    const deadline = Date.now() + 10000
    while (!await win.webContents.executeJavaScript(`Boolean((${fn.toString()})(${JSON.stringify(argument)}))`)) {
      if (Date.now() > deadline) throw new Error('Renderer initialization timed out')
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  const load = () => process.env.PICPORTAL_BASELINE_URL
    ? win.loadURL(process.env.PICPORTAL_BASELINE_URL)
    : win.loadFile(path.resolve('packages/renderer/dist/index.html'), { hash: '/projects' })
  if (!actualMain) await load()
  await waitFor(() => location.hash === '#/projects' && document.querySelector('.project-list'))
  const startupMs = Date.now() - started
  const metrics = await evaluate(rendererChecks, dataset)
  await new Promise((resolve) => {
    win.webContents.once('did-finish-load', resolve)
    win.webContents.reload()
  })
  await waitFor(() => document.querySelector('.project-list') && document.body.textContent.includes('匿名測試專案'))
  for (const route of ['settings', 'about', 'projects']) {
    await evaluate((route) => { location.hash = `#/${route}` }, route)
    await waitFor((route) => location.hash === `#/${route}` && document.querySelector(`.${route}`), route)
  }
  await evaluate(() => document.querySelector('.project-card').click())
  await waitFor(() => location.hash.includes('/grid-view'))
  for (const route of ['grid-view', 'virtual-list', 'virtual-grid', 'focus-view']) {
    await evaluate((route) => { location.hash = `#/editor/viewer/${route}` }, route)
    await waitFor((route) => {
      const images = [...document.querySelectorAll('img[src^="local-resource:"]')]
      return location.hash === `#/editor/viewer/${route}` && images.length && images.every((img) => img.complete && img.naturalWidth > 0)
    }, route)
  }
  const stored = JSON.parse(await fs.readFile(path.join(dataset.root, 'user-data', 'config.json'), 'utf8'))
  assert.equal(stored.settings.general.locale, 'tw')
  assert.equal(stored.projects.length, 1)
  assert.equal(win.webContents.isDevToolsOpened(), false)
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ originalUserData, startupMs, ...metrics, memory: process.memoryUsage(), routes: 'projects/settings/about and four existing viewer routes', mode: process.env.PICPORTAL_BASELINE_URL ? 'development' : 'built' }))
  win.destroy()
  app.exit(0)
}

async function parent() {
  const { build } = require('esbuild')
  const { spawn } = require('child_process')
  const { createDataset, removeDataset } = require('./migration-fixtures.cjs')
  const dataset = await createDataset()
  let devServer
  try {
    let devUrl
    if (process.argv.includes('--development')) {
      process.env.MODE = 'development'
      const { createServer } = require('vite')
      devServer = await createServer({ configFile: 'packages/renderer/vite.config.js', mode: 'development', server: { host: '127.0.0.1', port: 0 } })
      await devServer.listen()
      devUrl = `http://127.0.0.1:${devServer.httpServer.address().port}/#/projects`
    }
    await fs.mkdir(path.join(dataset.root, 'user-data'))
    await build({ entryPoints: ['packages/preload/src/main/index.ts'], outfile: path.join(dataset.root, 'ipc.cjs'), platform: 'node', bundle: true, format: 'cjs', external: ['electron'] })
    await build({ entryPoints: ['packages/main/src/localResourceProtocol.ts'], outfile: path.join(dataset.root, 'protocol.cjs'), platform: 'node', bundle: true, format: 'cjs', external: ['electron'] })
    const original = JSON.parse(await fs.readFile(path.join(dataset.root, 'normal.db'), 'utf8'))
    await new Promise((resolve, reject) => {
      const env = { ...process.env, PICPORTAL_BASELINE_DATA: JSON.stringify(dataset) }
      if (devUrl) env.PICPORTAL_BASELINE_URL = devUrl
      delete env.ELECTRON_RUN_AS_NODE
      const processHandle = spawn(require('electron'), [__filename, '--child'], { env, windowsHide: true, stdio: 'inherit' })
      const timeout = setTimeout(() => { processHandle.kill(); reject(new Error('Electron baseline timed out')) }, 45000)
      processHandle.on('error', (error) => { clearTimeout(timeout); reject(error) })
      processHandle.on('exit', (code) => { clearTimeout(timeout); code === 0 ? resolve() : reject(new Error(`Electron baseline exited ${code}`)) })
    })
    const final = JSON.parse(await fs.readFile(path.join(dataset.root, 'normal.db'), 'utf8'))
    assert.deepEqual(final, original)
    assert.equal((await fs.readFile(path.join(dataset.root, 'corrupt.db'), 'utf8')).trim(), '{"id":"broken-project","portals":[')
    console.log('PASS Electron baseline with isolated data; unknown fields and IDs preserved')
  } finally {
    if (devServer) await devServer.close()
    await removeDataset(dataset.root)
  }
}

;(process.versions.electron ? child() : parent()).catch((error) => {
  console.error(error)
  if (process.versions.electron) require('electron').app.exit(1)
  else process.exitCode = 1
})
