// Genuine OS drop acceptance. Only a human drags from Explorer; this test does
// not emit drop events or bypass native path authorization.
const assert = require('assert/strict')
const fs = require('fs/promises')
const path = require('path')

async function exerciseDrops(h) {
  const { dataset, root, env, evaluate, invoke, code, waitFor, close, start, loadedImages, imageLoaded, send } = h
  const config = JSON.parse(await fs.readFile(path.join(root, 'browse.json'), 'utf8'))
  const prefsPath = path.join(process.env.APPDATA, config.identifier, 'settings.json')
  const prefs = async () => JSON.parse(await fs.readFile(prefsPath, 'utf8'))
  const normal = path.join(dataset.root, 'normal.db')
  const copy = path.join(dataset.source, '拖入副本.db')
  const folder = path.join(dataset.destination, '拖入分類')
  const original = await fs.readFile(normal)
  const legacyPath = path.join(env.APPDATA, 'PicPortal', 'config.json')
  const legacyBytes = await fs.readFile(legacyPath)
  await fs.copyFile(normal, copy)
  await fs.mkdir(folder)
  assert.equal((await prefs()).__picportalMigration.completed, true)
  assert.equal(await code('project_connect', { path: copy }), 'OUTSIDE_SCOPE')
  await evaluate(`document.querySelector('div.project-card').click()`)
  await waitFor(() => evaluate(`location.hash.includes('/grid-view')`))
  await loadedImages('.image-item img')
  await evaluate(`globalThis.$viewer=$pinia._s.get('viewer');globalThis.$portal=$pinia._s.get('portalPane')`)

  const openDropModal = async () => {
    await evaluate(`document.querySelector('.group-header .controls-icon button .n-icon').click()`)
    await waitFor(() => evaluate(`!!document.querySelector('.n-modal .n-tabs-tab')`))
    await evaluate(`[...document.querySelectorAll('.n-modal .n-tabs-tab')].find(e=>/Drop|拖/.test(e.textContent)).click()`)
    await waitFor(() => evaluate(`!!document.querySelector('.native-drop-zone')`))
  }
  const escape = async () => {
    await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 })
    await send('Input.dispatchKeyEvent', { type:'keyUp', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 })
    await waitFor(() => evaluate(`!document.querySelector('.n-modal')`))
    // PortalTagModal emits close after its exit transition; wait for unmount
    // before clicking the parent control to create a fresh subscription.
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  const openExplorer = async directory => {
    const { session } = await invoke('project_connect', { path:normal })
    await invoke('desktop_open_folder', { session, path:directory })
    await evaluate('$app.ConnectProjectDB()')
  }
  const action = async (kind, source) => {
    const box = await evaluate(`(()=>{const r=document.querySelector('.native-drop-zone').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()`)
    await fs.writeFile(path.join(root, 'action.json'), JSON.stringify({ kind, source, box }))
    console.log(`ACTION ${kind}: ${source}\nSmoke profile: ${root}`)
  }

  // Mount, unmount and remount before the real drop to exercise listener cleanup.
  await openDropModal()
  await escape()
  await openDropModal()
  await openExplorer(dataset.destination)
  await action('folder-drop', folder)
  await waitFor(() => evaluate(`document.querySelector('.folder-list')?.textContent.includes('拖入分類')`), 1200000)
  assert.equal(await evaluate(`document.querySelectorAll('.folder-list .folder-item').length`), 1)
  // DropZone's dashed button is also block; the footer is the final block button.
  await evaluate(`Array.from(document.querySelectorAll('.n-modal .n-button--block')).pop().click()`)
  await waitFor(() => evaluate(`!document.querySelector('.n-modal')`))
  const saved = JSON.parse(await fs.readFile(normal, 'utf8'))
  const added = saved.portals[0].childs.find(p => p.link === folder)
  assert(added?.id)
  assert.equal(added.name, '拖入分類')
  assert.equal(saved.id, 'project-001')
  assert.equal(saved.extraProject.keep, true)
  assert.equal(saved.portals[0].childs[0].extraPortal, true)
  console.log('PASS genuine OS folder drop after remount creates exactly one durable Portal; IDs and unknown fields preserved')

  // The second file has the same internal project ID, but no picker or stored
  // list entry has authorized it. Only its actual OS drop can authorize connect.
  await openExplorer(dataset.source)
  await evaluate(`location.hash='#/projects'`)
  await waitFor(() => evaluate(`!!document.querySelector('.projects .native-drop-zone')`))
  assert.equal(await code('project_connect', { path:copy }), 'OUTSIDE_SCOPE')
  await action('project-drop', copy)
  await waitFor(() => evaluate(`location.hash.includes('/grid-view') && $app.openProject?.path===${JSON.stringify(copy)}`), 1200000)
  await loadedImages('.image-item img')
  const projects = (await prefs()).projects
  assert.equal(projects.length, 2)
  assert.notEqual(projects[0].id, projects[1].id)
  assert.equal(await evaluate('$app.dbData.id'), 'project-001')
  assert.deepEqual(await fs.readFile(copy), original)
  const copyUrl = await evaluate(`window.__TAURI_INTERNALS__.convertFileSrc(${JSON.stringify(copy)},'asset')`)
  assert.equal(await imageLoaded(copyUrl), false, 'Drop authorization must not expose project JSON via asset protocol')
  console.log('PASS genuine OS .db drop authorizes only the dropped file, opens images and saves a separate list ID without changing JSON bytes')

  await close()
  await start()
  await waitFor(() => evaluate(`document.querySelectorAll('div.project-card').length===2`))
  await evaluate(`document.querySelectorAll('div.project-card')[1].click()`)
  await waitFor(() => evaluate(`location.hash.includes('/grid-view')`))
  await loadedImages('.image-item img')
  assert.equal(await evaluate('$app.openProject.path'), copy)
  assert.deepEqual(await fs.readFile(copy), original)
  assert.deepEqual(await fs.readFile(legacyPath), legacyBytes)
  await evaluate(`location.hash='#/projects'`)
  await waitFor(() => evaluate(`document.querySelectorAll('div.project-card').length===2`))
  await evaluate(`document.querySelector('div.project-card').click()`)
  await waitFor(() => evaluate(`location.hash.includes('/grid-view')`))
  assert.equal(await evaluate(`$app.dbData.portals[0].childs.some(p=>p.id===${JSON.stringify(added.id)} && p.link===${JSON.stringify(folder)})`), true)
  console.log('PASS restart restores dropped project browsing and the dropped Portal; source config and copied project bytes unchanged')
}
module.exports = { exerciseDrops }
