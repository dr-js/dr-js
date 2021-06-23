const { resolve } = require('path')
const { promises: fsAsync } = require('fs')
const { createFileWatcherExot } = require('../../output-gitignore/library/node/file/Watch.js')
const { createDirectory } = require('../../output-gitignore/library/node/file/Directory.js')
const { modifyDeleteForce } = require('../../output-gitignore/library/node/file/Modify.js')

const TEMP_PATH = resolve(__dirname, 'file-watcher-gitignore')

const main = async () => {
  const { up, subscribe } = createFileWatcherExot({
    path: resolve(TEMP_PATH, 'a/b'),
    // path: resolve(TEMP_PATH, 'a/b/file'),
    persistent: true
  })
  subscribe((changeState) => console.log('>> [subscribe called] <<', changeState))

  await modifyDeleteForce(TEMP_PATH)
  await createDirectory(resolve(TEMP_PATH, 'a/b/c/d/e'))
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/file'), 'FILE')
  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/e/file'), 'FILE')

  await up()

  // un-comment to test if will log [subscribe called]

  // await renameAsync(resolve(TEMP_PATH, 'a/b'), resolve(TEMP_PATH, 'a/b-rename'))
  // await renameAsync(resolve(TEMP_PATH, 'a/b/c'), resolve(TEMP_PATH, 'a/b/c-rename'))

  await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/file-add'), 'FILE-ADDED')

  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/file'), 'FILE-CHANGED')
  // await fsAsync.writeFile(resolve(TEMP_PATH, 'a/b/c/d/e/file'), 'FILE-CHANGED')
}

main().catch(console.error)
