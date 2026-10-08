const assert = require('assert/strict')
const fs = require('fs/promises')
const path = require('path')
const os = require('os')
const net = require('net')
const { spawn } = require('child_process')

async function main() {
  if (process.platform !== 'win32' || typeof WebSocket === 'undefined') throw new Error('Tauri skeleton smoke requires Windows and Node 22+')
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'picportal-tauri-smoke-'))
  const titlePath = path.resolve('packages/renderer/src/layout/components/TitleBar.vue')
  const originalTitle = await fs.readFile(titlePath)
  const built = process.argv.includes('--built')
  const { version } = require('../package.json')
  const tauriVersion = require('../package.json').dependencies['@tauri-apps/api']
  let server, processHandle, socket, exit, originalRestored = true
  let log = ''
  const pending = new Map()
  let nextId = 1
  async function waitFor(check, timeout = 20000) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      const value = await check()
      if (value) return value
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    throw new Error(`Smoke timed out. Tauri output:\n${log.slice(-4000)}`)
  }
  function send(method, params = {}) {
    const id = nextId++
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 10000)
      pending.set(id, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  try {
    const portServer = net.createServer()
    await new Promise((resolve) => portServer.listen(0, '127.0.0.1', resolve))
    const debugPort = portServer.address().port
    await new Promise((resolve) => portServer.close(resolve))
    process.env.PICPORTAL_RUNTIME = 'tauri'
    process.env.MODE = 'development'
    if (!built) {
      const { createServer } = require('vite')
      server = await createServer({ configFile: 'packages/renderer/vite.config.js', mode: 'development', server: { host: '127.0.0.1', port: 5173, strictPort: true } })
      await server.listen()
    }
    const config = JSON.parse(await fs.readFile('src-tauri/tauri.conf.json', 'utf8'))
    const override = { identifier: `io.github.proladon.picportal.skeleton.${path.basename(root).split('-').at(-1).toLowerCase()}`, build: { beforeDevCommand: null }, app: { windows: [{ ...config.app.windows[0], visible: false, focus: false, dataDirectory: path.join(root, 'webview') }] } }
    const configPath = path.join(root, 'smoke.json')
    await fs.writeFile(configPath, JSON.stringify(override))
    const env = { ...process.env, APPDATA:path.join(root,'legacy-appdata'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${debugPort}` }
    if (built) {
      console.log('Building the embedded frontend smoke executable')
      const builder = spawn(process.execPath, [require.resolve('@tauri-apps/cli/tauri.js'), 'build', '--debug', '--no-bundle', '--config', configPath], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      builder.stdout.on('data', (data) => { log += data })
      builder.stderr.on('data', (data) => { log += data })
      const code = await new Promise((resolve, reject) => { builder.once('exit', resolve); builder.once('error', reject) })
      if (code !== 0) throw new Error(log.slice(-4000))
    }
    processHandle = built
      ? spawn(path.resolve('src-tauri/target/debug/picportal.exe'), [], { env, cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      : spawn(process.execPath, [require.resolve('@tauri-apps/cli/tauri.js'), 'dev', '--no-watch', '--config', configPath], { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    processHandle.stdout.on('data', (data) => { log += data })
    processHandle.stderr.on('data', (data) => { log += data })
    exit = new Promise((resolve) => processHandle.once('exit', resolve))
    const target = await waitFor(async () => {
      if (processHandle.exitCode !== null) throw new Error(log)
      try {
        const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
        return targets.find((target) => target.type === 'page' && target.url.startsWith(built ? 'http://tauri.localhost' : 'http://127.0.0.1:5173'))
      } catch { return false }
    }, 180000)
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
    socket.addEventListener('message', (event) => {
      const response = JSON.parse(event.data)
      const request = pending.get(response.id)
      if (request) {
        clearTimeout(request.timeout)
        pending.delete(response.id)
        response.error ? request.reject(new Error(JSON.stringify(response.error))) : request.resolve(response.result)
      }
    })
    socket.addEventListener('close', () => {
      for (const request of pending.values()) {
        clearTimeout(request.timeout)
        request.reject(new Error('CDP closed'))
      }
      pending.clear()
    })
    await waitFor(() => evaluate(`location.hash === '#/projects' && !!document.querySelector('.projects')`))
    assert.equal(await evaluate(`!!document.querySelector('.desktop-status')`), false)
    const metadata = await evaluate(`(async () => { const invoke=window.__TAURI_INTERNALS__.invoke; return {runtime:globalThis.isTauri ? 'tauri' : 'unknown',os:await invoke('runtime_platform'),version:await invoke('plugin:app|version'),tauri:await invoke('plugin:app|tauri_version')} })()`)
    assert.deepEqual(metadata, { runtime: 'tauri', os: 'win32', version, tauri: tauriVersion })
    for (const route of ['about', 'settings', 'projects']) {
      await evaluate(`location.hash = '#/${route}'`)
      await waitFor(() => evaluate(`!!document.querySelector('.${route}')`))
      if (route === 'about') await waitFor(() => evaluate(`document.querySelector('.about').textContent.includes(${JSON.stringify(version)}) && document.querySelector('.about').textContent.includes(${JSON.stringify(tauriVersion)})`))
    }
    assert.equal(await evaluate(`!!document.querySelector('.n-spin-container--blur')`), false)
    assert.equal(await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--base').trim()`), '#ccc0b8')
    console.log('PASS native routes, styles, metadata and default preferences')
    if (!built) {
      // Spy at the adapter boundary; native IPC globals are immutable in production.
      await evaluate(`(async () => { const d=(await import('/src/desktop/index.ts')).useDesktop(); globalThis.dragCalls=0; d.appWindow.startDragging=async()=>{globalThis.dragCalls++}; document.querySelector('.app-name').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0})); })()`)
      assert.equal(await evaluate('globalThis.dragCalls'), 1)
      await evaluate(`document.querySelector('.win-btn.max').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))`)
      assert.equal(await evaluate('globalThis.dragCalls'), 1, 'Window buttons must not drag')
    }
    for (const maximized of [true, false]) {
      await evaluate(`document.querySelector('.win-btn.max').click()`)
      await waitFor(() => evaluate(`(async () => (await window.__TAURI_INTERNALS__.invoke('plugin:window|is_maximized',{label:'main'})) === ${maximized})()`))
      assert.equal(await evaluate(`(async () => window.__TAURI_INTERNALS__.invoke('plugin:window|is_maximized',{label:'main'}))()`), maximized)
    }
    if (!built) {
      const changedTitle = originalTitle.toString().replace('class="app-name">PicPortal', 'class="app-name">PicPortal HMR')
      assert.notEqual(changedTitle, originalTitle.toString())
      originalRestored = false
      await fs.writeFile(titlePath, changedTitle)
      await waitFor(() => evaluate(`document.querySelector('.app-name').textContent.includes('HMR')`))
      await fs.writeFile(titlePath, originalTitle)
      originalRestored = true
      await waitFor(() => evaluate(`document.querySelector('.app-name').textContent === 'PicPortal'`))
    }
    await evaluate(`document.querySelector('.win-btn.min').click()`)
    await waitFor(() => evaluate(`(async () => window.__TAURI_INTERNALS__.invoke('plugin:window|is_minimized',{label:'main'}))()`))
    await evaluate(`document.querySelector('.win-btn.close').click()`).catch(() => {})
    let exitTimeout
    const code = await Promise.race([exit, new Promise((_, reject) => {
      exitTimeout = setTimeout(() => reject(new Error('Window close did not exit app')), 10000)
    })]).finally(() => clearTimeout(exitTimeout))
    assert.equal(code, 0)
    console.log(`PASS native Tauri skeleton (${built ? 'embedded frontend' : 'Vite + HMR'}): routes/styles, metadata, default preferences, window controls${built ? '' : ', titlebar drag isolation'}`)
  } finally {
    if (!originalRestored) await fs.writeFile(titlePath, originalTitle)
    if (socket) socket.close()
    for (const request of pending.values()) clearTimeout(request.timeout)
    if (processHandle && processHandle.exitCode === null) {
      await new Promise((resolve) => { const killer=spawn('taskkill', ['/pid', String(processHandle.pid), '/t', '/f'], {windowsHide:true,stdio:'ignore'}); killer.once('exit', resolve) })
      await exit
    }
    if (server) await server.close()
    // The isolated WebView profile is retained for diagnostics; it contains no projects or settings.
    console.log(`Smoke profile: ${root}`)
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
