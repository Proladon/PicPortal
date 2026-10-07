const fs = require('fs/promises')
const path = require('path')
const os = require('os')

async function createDataset() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'picportal-migration-'))
  const source = path.join(root, '圖片 (測試) #100% [來源]')
  const destination = path.join(root, '目的資料夾')
  const image = path.join(source, '圖片 #100%.png')
  await fs.mkdir(path.join(source, '多層', '第二層'), { recursive: true })
  await fs.mkdir(destination)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=', 'base64')
  for (const file of [image, path.join(source, '重複.png'), path.join(source, '多層', '第二層', '重複.png'), path.join(source, '.隱藏.png'), path.join(source, '小寫.jpg'), path.join(source, '大寫.JPG')]) {
    await fs.writeFile(file, png)
  }
  await fs.writeFile(path.join(source, '非圖片.txt'), 'ignore')
  const replacements = { __SOURCE__: source, __DESTINATION__: destination, __IMAGE__: image, __PROJECT__: path.join(root, 'normal.db') }
  function resolve(value) {
    if (typeof value === 'string') return replacements[value] || value
    if (Array.isArray(value)) return value.map(resolve)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item)]))
    return value
  }
  const fixtures = path.join(__dirname, 'fixtures', 'migration')
  for (const name of await fs.readdir(fixtures)) {
    const text = await fs.readFile(path.join(fixtures, name), 'utf8')
    await fs.writeFile(path.join(root, name), name === 'corrupt.db' ? text : JSON.stringify(resolve(JSON.parse(text))))
  }
  return { root, source, destination, image }
}

async function removeDataset(root) {
  const resolved = path.resolve(root)
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('picportal-migration-')) {
    throw new Error('Refusing to remove a non-fixture directory')
  }
  await fs.rm(resolved, { recursive: true, force: true })
}

module.exports = { createDataset, removeDataset }

if (require.main === module) {
  createDataset().then((dataset) => console.log(JSON.stringify(dataset, null, 2))).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
