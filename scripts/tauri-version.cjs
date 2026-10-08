// package.json is the only version edited by the release author.
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const write = (file, value) => fs.writeFileSync(path.join(root, file), value)
const { version } = JSON.parse(read('package.json'))
assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/)
const sources = [
  ['src-tauri/Cargo.toml', /(\[package\][\s\S]*?\nversion = ")([^"]+)(")/],
  ['src-tauri/Cargo.lock', /(\[\[package\]\]\r?\nname = "picportal"\r?\nversion = ")([^"]+)(")/]
]
const sync = process.argv.includes('--write')
for (const [file, pattern] of sources) {
  const content = read(file)
  const match = content.match(pattern)
  assert(match, `Missing PicPortal version in ${file}`)
  if (sync) write(file, content.replace(pattern, (_, prefix, old, suffix) => `${prefix}${version}${suffix}`))
  else assert.equal(match[2], version, `${file}: run npm run version:sync`)
}
const lock = JSON.parse(read('package-lock.json'))
if (sync) {
  lock.version = lock.packages[''].version = version
  lock.packages[''].engines = JSON.parse(read('package.json')).engines
  write('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`)
} else {
  assert.equal(lock.version, version)
  assert.equal(lock.packages[''].version, version)
}
assert.equal(JSON.parse(read('src-tauri/tauri.conf.json')).version, '../package.json')
if (process.env.GITHUB_REF?.startsWith('refs/tags/')) {
  assert.equal(process.env.GITHUB_REF, `refs/tags/v${version}`, 'Release tag must match package.json')
}
console.log(`PASS version ${version}: package, lockfiles, Cargo and Tauri`)
