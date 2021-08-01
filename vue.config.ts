import path from 'path'
module.exports = {
  pluginOptions: {
    electronBuilder: {
      preload: path.join(__dirname, 'preload.ts')
    }
  }
}