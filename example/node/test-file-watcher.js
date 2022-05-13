const { resolve } = require('node:path')
const { writeText } = require('../../output-gitignore/library/node/fs/File.js')
const { createFileWatcherExot } = require('../../output-gitignore/library/node/fs/Watch.js')
const { createDirectory } = require('../../output-gitignore/library/node/fs/Directory.js')
const { modifyDeleteForce } = require('../../output-gitignore/library/node/fs/Modify.js')

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
  await writeText(resolve(TEMP_PATH, 'a/file'), 'FILE')
  await writeText(resolve(TEMP_PATH, 'a/b/file'), 'FILE')
  await writeText(resolve(TEMP_PATH, 'a/b/c/file'), 'FILE')
  await writeText(resolve(TEMP_PATH, 'a/b/c/d/file'), 'FILE')
  await writeText(resolve(TEMP_PATH, 'a/b/c/d/e/file'), 'FILE')

  await up()

  // un-comment to test if will log [subscribe called]

  // await renameAsync(resolve(TEMP_PATH, 'a/b'), resolve(TEMP_PATH, 'a/b-rename'))
  // await renameAsync(resolve(TEMP_PATH, 'a/b/c'), resolve(TEMP_PATH, 'a/b/c-rename'))

  await writeText(resolve(TEMP_PATH, 'a/b/file-add'), 'FILE-ADDED')

  // await appendText(resolve(TEMP_PATH, 'a/file'), 'FILE-CHANGED')
  // await appendText(resolve(TEMP_PATH, 'a/b/file'), 'FILE-CHANGED')
  // await appendText(resolve(TEMP_PATH, 'a/b/c/file'), 'FILE-CHANGED')
  // await appendText(resolve(TEMP_PATH, 'a/b/c/d/file'), 'FILE-CHANGED')
  // await appendText(resolve(TEMP_PATH, 'a/b/c/d/e/file'), 'FILE-CHANGED')
}

main().catch(console.error)
