// Windows native smoke. Select the printed anonymous paths in the real OS
// dialogs (manually or through computer-use). No test-only authorization IPC.
const assert = require('assert/strict')
const fs = require('fs/promises')
const path = require('path')
const os = require('os')
const net = require('net')
const { spawn } = require('child_process')
const { createDataset } = require('./migration-fixtures.cjs')

async function main() {
  if (process.platform !== 'win32' || typeof WebSocket === 'undefined') throw new Error('Requires Windows and Node 22+')
  const dataset = await createDataset()
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'picportal-tauri-browse-')))
  const ci = process.argv.includes('--ci')
  const installer = process.argv.includes('--installer')
  if (installer && !ci) throw new Error('--installer requires --ci')
  let executable = path.resolve(`src-tauri/target/${ci ? 'release' : 'debug'}/picportal.exe`)
  const installDir = path.join(root, 'installed')
  let installAttempted = false
  const original = await fs.readFile(path.join(dataset.root, 'normal.db'))
  const emptyBytes = await fs.readFile(path.join(dataset.root, 'empty.db'))
  const requests = new Map()
  const assetResponses = new Map()
  let processHandle, socket, exit, nextId = 1, log = ''
  let migrationLock
  async function releaseMigrationLock() {
    if (!migrationLock || migrationLock.exitCode !== null) return
    migrationLock.stdin.write('\n')
    await new Promise(resolve => migrationLock.once('exit', resolve))
  }
  const portServer = net.createServer()
  await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve))
  const port = portServer.address().port
  await fs.writeFile(path.join(root, 'debug.json'), JSON.stringify({port}))
  await new Promise(resolve => portServer.close(resolve))
  const env = { ...process.env, APPDATA: path.join(root, 'legacy-appdata'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` }
  async function waitFor(check, timeout = 60000) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      const value = await check()
      if (value) return value
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    throw new Error(`Browse smoke timed out. ${log.slice(-2000)}`)
  }
  function send(method, params = {}) {
    const id = nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { requests.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 10000)
      requests.set(id, { resolve, reject, timer })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const invoke = (command, args = {}) => evaluate(`window.__TAURI_INTERNALS__.invoke(${JSON.stringify(command)},${JSON.stringify(args)})`)
  const code = (command, args) => evaluate(`window.__TAURI_INTERNALS__.invoke(${JSON.stringify(command)},${JSON.stringify(args)}).then(()=>null,e=>e.code)`)
  async function run(file, args, timeout = 180000) {
    const child = spawn(file, args, { env, windowsHide: true, windowsVerbatimArguments: file.endsWith('.exe') && file !== process.execPath, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout.on('data', data => { log += data })
    child.stderr.on('data', data => { log += data })
    let timer
    try {
      const result = await Promise.race([
        new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject) }),
        new Promise((_, reject) => { timer = setTimeout(() => { child.kill(); reject(Error(`Process timed out: ${file}`)) }, timeout) })
      ])
      if (result !== 0) throw new Error(`Process failed (${result}): ${file}\n${log.slice(-5000)}`)
    } finally { clearTimeout(timer) }
  }
  async function start() {
    processHandle = spawn(executable, [], { env, cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    processHandle.once('error', error => { log += error.stack })
    processHandle.stdout.on('data', data => { log += data })
    processHandle.stderr.on('data', data => { log += data })
    exit = new Promise(resolve => processHandle.once('exit', resolve))
    const target = await waitFor(async () => {
      if (processHandle.exitCode !== null) throw new Error(log)
      try { return (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page' && t.url.startsWith('http://tauri.localhost')) } catch { return false }
    }, 60000)
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.method === 'Network.responseReceived') assetResponses.set(message.params.response.url, message.params.response.status)
      const request = requests.get(message.id)
      if (request) {
        clearTimeout(request.timer)
        requests.delete(message.id)
        message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result)
      }
    })
    await send('Network.enable')
    await waitFor(() => evaluate(`!!document.querySelector('.projects .btn-container button')`))
    await evaluate(`globalThis.$pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia; globalThis.$app = $pinia._s.get('app')`)
  }
  async function close() {
    if (processHandle?.exitCode === null) {
      await invoke('plugin:window|close').catch(() => {})
      await waitFor(() => processHandle.exitCode !== null)
      await exit
    }
    socket?.close()
  }
  async function chooseProject(name) {
    await evaluate(`location.hash = '#/projects'`)
    await waitFor(() => evaluate(`!!document.querySelector('.projects .btn-container button')`))
    if (ci) {
      await waitFor(() => evaluate(`[...document.querySelectorAll('.project-card')].some(card=>card.querySelector('.project-path')?.textContent.trim()===${JSON.stringify(path.join(dataset.root, name))})`))
      await evaluate(`[...document.querySelectorAll('.project-card')].find(card=>card.querySelector('.project-path')?.textContent.trim()===${JSON.stringify(path.join(dataset.root, name))}).click()`)
    } else {
      console.log(`ACTION select project: ${path.join(dataset.root, name)}`)
      await evaluate(`document.querySelector('.projects .import-project-btn').click()`)
    }
    await waitFor(() => evaluate(`location.hash.includes('/grid-view') && $app.openProject?.path === ${JSON.stringify(path.join(dataset.root, name))}`), ci ? 60000 : 600000)
    await evaluate(`globalThis.$viewer = $pinia._s.get('viewer')`)
  }
  async function imageLoaded(url) {
    return evaluate(`new Promise(resolve => { const image = new Image(); const timer = setTimeout(()=>resolve(false),5000); image.onload=()=>{clearTimeout(timer);resolve(image.naturalWidth>0)}; image.onerror=()=>{clearTimeout(timer);resolve(false)};image.src=${JSON.stringify(url)} })`)
  }
  async function loadedImages(selector) {
    return waitFor(() => evaluate(`(() => { const images=[...document.querySelectorAll(${JSON.stringify(selector)})];return images.length > 0 && images.every(i=>i.complete && i.naturalWidth>0) })()`))
  }
  try {
    const config = JSON.parse(await fs.readFile('src-tauri/tauri.conf.json', 'utf8'))
    const suffix = path.basename(root).split('-').at(-1).toLowerCase()
    const override = { identifier: `io.github.proladon.picportal.smoke.${suffix}`, app: { windows: [{ ...config.app.windows[0], ...(ci ? { visible: false, focus: false, devtools: false } : {}), dataDirectory: path.join(root, 'webview') }] } }
    if (installer) override.productName = `PicPortal Smoke ${suffix}`
    const configPath = path.join(root, 'browse.json')
    await fs.writeFile(configPath, JSON.stringify(override))
    console.log(`Dataset: ${dataset.root}\nBuilding the embedded frontend for native browsing`)
    if (ci || process.argv.includes('--interactions') || process.argv.includes('--drops')) {
      await fs.mkdir(path.join(env.APPDATA, 'PicPortal'), { recursive:true })
      await fs.copyFile(path.join(dataset.root,'config.json'),path.join(env.APPDATA,'PicPortal','config.json'))
    }
    if (process.argv.includes('--interactions')) {
      const prefsDir = path.join(process.env.APPDATA, override.identifier)
      await fs.mkdir(prefsDir, { recursive:true })
      const prefsPath = path.join(prefsDir, 'settings.json')
      await fs.writeFile(prefsPath, '{}')
      const script = `& { param($target) $taskHandle = [IO.File]::Open($target,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read); Write-Output 'LOCKED'; [Console]::ReadLine() | Out-Null; $taskHandle.Dispose() } '${prefsPath.replace(/'/g, "''")}'`
      migrationLock = spawn('powershell', ['-NoProfile', '-Command', script], { windowsHide:true, stdio:['pipe','pipe','pipe'] })
      await new Promise((resolve,reject) => { migrationLock.stdout.once('data',data=>String(data).includes('LOCKED') ? resolve() : reject(Error(String(data)))); migrationLock.once('exit',code=>{if(code)reject(Error('Migration lock failed'))}); migrationLock.once('error',reject) })
    }
    if (ci && process.argv.includes('--skip-build')) throw new Error('CI smoke must build its own isolated configuration')
    if (!process.argv.includes('--skip-build')) {
      await run(process.execPath, [require.resolve('@tauri-apps/cli/tauri.js'), 'build', ...(ci ? ['--ci'] : ['--debug']), ...(installer ? ['--bundles', 'nsis'] : ['--no-bundle']), '--config', configPath, '--', '--locked'], 1200000)
    }
    if (installer) {
      const bundles = path.resolve('src-tauri/target/release/bundle/nsis')
      const files = (await fs.readdir(bundles)).filter(name => name.startsWith(override.productName) && name.endsWith('-setup.exe'))
      assert.equal(files.length, 1, 'Expected one isolated NSIS installer')
      installAttempted = true
      // NSIS requires /D as the last argument, without surrounding quotes.
      await run(path.join(bundles, files[0]), ['/S', `/D=${installDir}`])
      executable = path.join(installDir, 'picportal.exe')
      assert.equal(await fs.stat(executable).then(stat => stat.isFile()), true)
      console.log('PASS NSIS silent installation in isolated temporary directory')
    }
    await start()
    const normal = path.join(dataset.root, 'normal.db')
    if (ci) {
      await require('./tauri-ci.cjs').exerciseCi({ dataset, root, env, evaluate, invoke, code, waitFor, chooseProject, close, start, loadedImages, imageLoaded, send, assetResponses })
      await close()
      if (installer) {
        const settings = path.join(process.env.APPDATA, override.identifier, 'settings.json')
        const before = await fs.readFile(settings)
        const legacy = await fs.readFile(path.join(env.APPDATA, 'PicPortal', 'config.json'))
        await run(path.join(installDir, 'uninstall.exe'), ['/S', `_?=${installDir}`])
        installAttempted = false
        await waitFor(() => fs.stat(executable).then(() => false, () => true))
        assert.deepEqual(await fs.readFile(settings), before, 'Uninstall must preserve Tauri settings')
        assert.deepEqual(await fs.readFile(path.join(env.APPDATA, 'PicPortal', 'config.json')), legacy)
        assert.equal((JSON.parse(await fs.readFile(normal, 'utf8'))).id, 'project-001', 'Uninstall must preserve project data')
        console.log('PASS NSIS uninstall removes app and preserves settings, legacy config and project')
      }
      return
    }
    if (process.argv.includes('--drops')) {
      await require('./tauri-drops.cjs').exerciseDrops({ dataset, root, env, evaluate, invoke, code, waitFor, close, start, loadedImages, imageLoaded, send })
      return
    }
    if (process.argv.includes('--interactions')) {
      await require('./tauri-interactions.cjs').exerciseInteractions({ dataset, root, env, evaluate, invoke, code, waitFor, chooseProject, close, start, loadedImages, imageLoaded, send, releaseMigrationLock })
      return
    }
    assert.equal(await code('project_connect', { path: normal }), 'OUTSIDE_SCOPE')
    assert.equal(await code('scan_images', { directory: dataset.source, extensions: ['png'] }), 'NO_PROJECT')
    await chooseProject('normal.db')
    if (process.argv.includes('--write')) {
      await require('./tauri-write.cjs').exerciseWrites({ dataset, evaluate, invoke, code, waitFor, chooseProject, close, start, loadedImages, imageLoaded })
      return
    }
    await waitFor(() => evaluate(`$viewer.folderFiles.length === 5`))
    assert.equal(await evaluate('$app.dbData.extraProject.keep'), true)
    assert.equal(await evaluate('$app.dbData.portals[0].childs[0].extraPortal'), true)
    assert.equal(await evaluate('$app.dbData.id'), 'project-001')
    assert.equal(await evaluate(`$app.dbData.dockings[0].target`), dataset.image)
    for (const [extensions, count] of [[['png'], 3], [['PNG', 'JPG'], 5], [['png', 'jpg', 'jpeg', 'gif', 'webp'], 5]]) {
      const files = await invoke('scan_images', { directory: dataset.source, extensions })
      assert.equal(files.length, count)
      assert(files.every(file => !path.basename(file).startsWith('.')))
    }
    assert.equal(await code('scan_images', { directory: dataset.root, extensions: ['png'] }), 'OUTSIDE_SCOPE')
    assert.equal(await code('file_exists', { path: path.join(dataset.root, 'config.json') }), 'OUTSIDE_SCOPE')
    const nativeSession = (await invoke('project_connect', { path: normal })).session
    assert.equal(await code('project_set_source', { path: dataset.destination, session: nativeSession }), 'OUTSIDE_SCOPE')
    await evaluate('$app.ConnectProjectDB()')
    const imageUrl = await evaluate(`window.__TAURI_INTERNALS__.convertFileSrc(${JSON.stringify(dataset.image)}, 'asset')`)
    assert.match(imageUrl, /^http:\/\/asset\.localhost/)
    assert.equal(await imageLoaded(imageUrl), true)
    for (const file of [path.join(dataset.root, 'config.json'), normal, path.join(dataset.source, '非圖片.txt'), path.join(dataset.source, '.隱藏.png')]) {
      const url = await evaluate(`window.__TAURI_INTERNALS__.convertFileSrc(${JSON.stringify(file)}, 'asset')`)
      assert.equal(await imageLoaded(url), false, `Unauthorized asset: ${file}`)
      await waitFor(() => assetResponses.has(url))
      assert.equal(assetResponses.get(url), 403, `Asset protocol must deny bytes, including JSON: ${file}`)
    }
    if (process.argv.includes('--scope-only')) {
      console.log('PASS native command authorization + asset HTTP 403 (project JSON, settings, hidden image and non-image file)')
      return
    }
    for (const [route, selector] of [['grid-view', '.image-item img'], ['list-view', '.list-view img'], ['virtual-grid', '.virtual-scroll-viewer img'], ['virtual-list', '.virtual-scroll-viewer img'], ['focus-view', '.focus-item img']]) {
      await evaluate(`location.hash = '#/editor/viewer/${route}'`)
      await loadedImages(selector)
      if (route !== 'focus-view') assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`), 5)
      assert.equal(await evaluate(`!!document.querySelector('.read-only-status')`), false)
      // Each mode uses the same normalized legacy docking paths and filters.
      await evaluate(`$viewer.filter.onlyDockings=true`)
      await waitFor(() => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length===1 && document.querySelector('.tag')?.textContent.includes('收藏')`))
      await loadedImages(selector)
      assert.equal(await evaluate(`!!document.querySelector('.tag .tag-close')`), true)
      await evaluate(`$viewer.filter.onlyDockings=false`)
      await waitFor(() => evaluate(`$viewer.showFiles.length===5`))
    }
    await evaluate(`location.hash = '#/editor/viewer/grid-view'`)
    await loadedImages('.image-item img')
    await evaluate(`document.querySelector('.magnifier').click()`)
    await loadedImages('.viewer-canvas img')
    await evaluate(`document.querySelector('.viewer-close').click()`)
    await waitFor(() => evaluate(`!document.querySelector('.viewer-canvas')`))
    assert.deepEqual(await fs.readFile(normal), original)
    console.log('PASS native project picker, JSON/IDs/unknown fields, 5 modes + filters/tags, preview, image URLs and command scopes')
    // Faults are applied only to anonymous copies; restoration is guaranteed.
    await fs.writeFile(normal, '{broken')
    assert.equal(await code('project_connect', { path: normal }), 'INVALID_JSON')
    await fs.writeFile(normal, original)
    const moved = `${dataset.source}-moved`
    await fs.rename(dataset.source, moved)
    try {
      await evaluate(`$viewer.signal.refresh=true`)
      await waitFor(() => evaluate(`$viewer.folderFiles.length===0 && document.querySelector('.desktop-status')?.textContent.includes('NOT_FOUND') && !document.querySelector('.loading-overlay, .view-loading')`))
    } finally { await fs.rename(moved, dataset.source) }
    await evaluate(`$viewer.signal.refresh=true`)
    await loadedImages('.image-item img')
    console.log('PASS corrupted JSON and disappearing source errors; UI recovers without stale images or perpetual loading')
    await chooseProject('empty.db')
    await waitFor(() => evaluate(`$viewer.folderFiles.length===0 && !$app.projectMainFolder.path`))
    console.log(`ACTION select source folder: ${dataset.source}`)
    await evaluate(`document.querySelector('button.main-folder-btn').click()`)
    await waitFor(() => evaluate(`$viewer.folderFiles.length===5`), 600000)
    await loadedImages('.image-item img')
    const savedEmpty = JSON.parse(await fs.readFile(path.join(dataset.root, 'empty.db'), 'utf8'))
    assert.equal(savedEmpty.mainFolder.path, dataset.source)
    assert.equal(await evaluate(`$app.dbData.mainFolder.path`), dataset.source)
    console.log('PASS empty project and persisted source folder selection')
    await close()
    assetResponses.clear()
    await start()
    assert.equal(await code('project_connect', { path: normal }), null, 'Saved project list restores validated selection on restart')
    assert.equal(await imageLoaded(imageUrl), false, 'Asset authorization must reset on process restart')
    await chooseProject('normal.db')
    await loadedImages('.image-item img')
    assert.deepEqual(await fs.readFile(normal), original)
    assert.equal(await evaluate('$app.dbData.id'), 'project-001')
    console.log('PASS process restart + project reselection restore browsing and scopes; all project bytes unchanged')
  } catch (error) {
    await fs.writeFile(path.join(root, 'tauri.log'), log)
    if (socket?.readyState === WebSocket.OPEN) {
      await send('Page.captureScreenshot').then(result => fs.writeFile(path.join(root, 'failure.png'), Buffer.from(result.data, 'base64'))).catch(() => {})
    }
    throw error
  } finally {
    await releaseMigrationLock()
    if (process.env.PICPORTAL_TEST_REPORT_DIR) {
      const report = path.resolve(process.env.PICPORTAL_TEST_REPORT_DIR)
      await fs.mkdir(report, { recursive: true })
      await fs.writeFile(path.join(report, 'tauri.log'), log)
      await fs.copyFile(path.join(root, 'failure.png'), path.join(report, 'failure.png')).catch(() => {})
      await fs.copyFile(path.join(dataset.root, 'normal.db'), path.join(report, 'normal.db'))
      await fs.writeFile(path.join(report, 'paths.json'), JSON.stringify({ dataset: dataset.root, profile: root, executable }, null, 2))
    }
    await fs.writeFile(path.join(dataset.root, 'normal.db'), original)
    await close().catch(async () => {
      if (processHandle?.exitCode === null) await new Promise(resolve => { const killer = spawn('taskkill', ['/pid', String(processHandle.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' }); killer.once('exit', resolve) })
    })
    if (installAttempted) await run(path.join(installDir, 'uninstall.exe'), ['/S', `_?=${installDir}`]).catch(error => console.error('Isolated uninstall cleanup:', error.message))
    await fs.writeFile(path.join(root, 'tauri.log'), log)
    for (const request of requests.values()) clearTimeout(request.timer)
    console.log(`Retained anonymous dataset: ${dataset.root}\nRetained smoke profile: ${root}`)
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
